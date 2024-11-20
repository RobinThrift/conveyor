package apiv1_test

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math/rand/v2"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"regexp"
	"strings"
	"testing"
	"time"

	"github.com/RobinThrift/belt/internal/app"
	"github.com/RobinThrift/belt/internal/ingress/apiv1"
)

func setup(ctx context.Context, t *testing.T) *client {
	port := rand.Uint32N(1000) + 8080

	config, err := app.ParseConfig(t.Name() + "_")
	if err != nil {
		t.Fatal(err)
	}

	config.Log.Level = "debug"
	config.Log.Format = "console"

	config.Database.Path = ":memory:"
	config.Database.DebugEnabled = true

	config.SecureCookies = false

	config.Init.Username = t.Name()
	config.Init.Password = t.Name()

	config.Addr = fmt.Sprintf("localhost:%d", port)
	config.CSRFSecret = []byte("cQTxrycG9HyTGc4XkuqkNqP5FqhD8Vig")
	config.Argon2 = app.Argon2{
		KeyLen:  32,
		Memory:  65536,
		Threads: 1,
		Time:    1,
		Version: 0x13,
	}

	errs := make(chan error)
	app := app.New(config) //nolint: contextcheck // false positive
	go func() {
		errs <- app.Start(ctx)
	}()

	t.Cleanup(func() {
		select {
		case startErr := <-errs:
			if startErr != nil {
				t.Error(startErr)
			}
		default:
		}
	})

	t.Cleanup(func() {
		stopCtx, stopCtxCancel := context.WithTimeout(ctx, time.Second*10)
		defer stopCtxCancel()
		stopErr := app.Stop(stopCtx)
		if stopErr != nil {
			t.Error(stopErr)
		}
	})

	cookies, err := cookiejar.New(nil)
	if err != nil {
		t.Fatal(err)
	}

	baseURL, err := url.Parse(fmt.Sprintf("http://localhost:%d", port))
	if err != nil {
		t.Fatal(err)
	}

	client := &client{
		c:       &http.Client{Jar: cookies},
		baseURL: baseURL,
	}

	err = waitForReady(baseURL.String())
	if err != nil {
		t.Fatal(err)
	}

	err = initialLogin(ctx, client, t.Name(), t.Name())
	if err != nil {
		t.Fatal(err)
	}

	return client
}

type client struct {
	c       *http.Client
	baseURL *url.URL
}

func get[P any](ctx context.Context, client *client, path string, queryPairs ...any) (*P, error) {
	url := client.baseURL.JoinPath(path)
	query := url.Query()
	for i := 0; i < len(queryPairs); i += 2 {
		query.Add(fmt.Sprint(queryPairs[i]), fmt.Sprint(queryPairs[i+1]))
	}
	url.RawQuery = query.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("error constructing GET request for %s: %w", url.String(), err)
	}

	res, err := client.c.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error executing GET request %s: %w", url.String(), err)
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		return nil, fmt.Errorf("GET request to %s returned with error status: %w", url.String(), unmarshalAPIError(res))
	}

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading body for GET reqquest %s: %w", url.String(), err)
	}

	var payload P
	err = json.Unmarshal(body, &payload)
	if err != nil {
		return nil, fmt.Errorf("error unmarshalling body for GET reqquest %s: %s\n%w", url.String(), body, err)
	}

	return &payload, nil
}

// func post[B, P any](ctx context.Context, client *client, path string, data B) (*P, error) {
// url :=client.baseURL.JoinPath(path)
// 	url := client.baseURL + path
//
// 	encoded, err := json.Marshal(data)
// 	if err != nil {
// 		return nil, fmt.Errorf("error marshalling body for POST reqquest %s: %w", url, err)
// 	}
//
// 	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(encoded))
// 	if err != nil {
// 		return nil, fmt.Errorf("error constructing POST request for %s: %w", url, err)
// 	}
//
// 	res, err := client.c.Do(req)
// 	if err != nil {
// 		return nil, fmt.Errorf("error executing POST request %s: %w", url, err)
// 	}
// 	defer res.Body.Close()
//
// 	if res.StatusCode >= 400 {
// 		return nil, fmt.Errorf("POST request to %s returned with error status: %w", url, unmarshalAPIError(res))
// 	}
//
// 	body, err := io.ReadAll(res.Body)
// 	if err != nil {
// 		return nil, fmt.Errorf("error reading body for POST reqquest %s: %w", url, err)
// 	}
//
// 	var payload P
// 	err = json.Unmarshal(body, &payload)
// 	if err != nil {
// 		return nil, fmt.Errorf("error unmarshalling body for GET reqquest %s: %s\n%w", url, body, err)
// 	}
//
// 	return &payload, nil
// }
//
// func patch[B, P any](ctx context.Context, client *client, path string, data B) (*P, error) {
// url :=client.baseURL.JoinPath(path)
// 	url := client.baseURL + path
//
// 	encoded, err := json.Marshal(data)
// 	if err != nil {
// 		return nil, fmt.Errorf("error marshalling body for PATCH reqquest %s: %w", url, err)
// 	}
//
// 	req, err := http.NewRequestWithContext(ctx, http.MethodPatch, url, bytes.NewReader(encoded))
// 	if err != nil {
// 		return nil, fmt.Errorf("error constructing PATCH request for %s: %w", url, err)
// 	}
//
// 	res, err := client.c.Do(req)
// 	if err != nil {
// 		return nil, fmt.Errorf("error executing PATCH request %s: %w", url, err)
// 	}
// 	defer res.Body.Close()
//
// 	if res.StatusCode >= 400 {
// 		return nil, fmt.Errorf("PATCH request to %s returned with error status: %w", url, unmarshalAPIError(res))
// 	}
//
// 	if res.StatusCode == http.StatusNoContent {
// 		return (*P)(nil), nil
// 	}
//
// 	body, err := io.ReadAll(res.Body)
// 	if err != nil {
// 		return nil, fmt.Errorf("error reading body for PATCH request %s: %w", url, err)
// 	}
//
// 	var payload P
// 	err = json.Unmarshal(body, &payload)
// 	if err != nil {
// 		return nil, fmt.Errorf("error unmarshalling body for PATCH request %s: %s\n%w", url, body, err)
// 	}
//
// 	return &payload, nil
// }
//
// func del(ctx context.Context, client *client, path string) error {
// url :=client.baseURL.JoinPath(path)
// 	url := client.baseURL + path
// 	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, url, nil)
// 	if err != nil {
// 		return fmt.Errorf("error constructing request for %s: %w", url, err)
// 	}
//
// 	res, err := client.c.Do(req)
// 	if err != nil {
// 		return fmt.Errorf("error executing DELETE request %s: %w", url, err)
// 	}
// 	defer res.Body.Close()
//
// 	if res.StatusCode >= 400 {
// 		return fmt.Errorf("DELETE request to %s returned with error status: %w", url, unmarshalAPIError(res))
// 	}
//
// 	return nil
// }

func unmarshalAPIError(res *http.Response) error {
	body, err := io.ReadAll(res.Body)
	if err != nil {
		return fmt.Errorf("error reading response body: %v %v: %w", res.StatusCode, res.Status, err)
	}

	var apierr apiv1.Error
	err = json.Unmarshal(body, &apierr)
	if err != nil {
		return fmt.Errorf("error unmarshalling response API error: %v %v: %w", res.StatusCode, res.Status, err)
	}

	return fmt.Errorf("%v (%v): %v", apierr.Title, apierr.Code, apierr.Detail)
}

func initialLogin(ctx context.Context, client *client, username string, password string) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, client.baseURL.JoinPath("login").String(), nil)
	if err != nil {
		return fmt.Errorf("error logging in: error constructing initial request: %w", err)
	}

	res, err := client.c.Do(req)
	if err != nil {
		return fmt.Errorf("error logging in: error executing initial request: %w", err)
	}
	client.c.Jar.SetCookies(client.baseURL, res.Cookies())

	// fmt.Printf("client.baseURL %v\n", client.baseURL.String())
	// fmt.Printf("res.Cookies() %v\n", res.Cookies())
	// fmt.Printf("cookies %v\n", client.c.Jar.Cookies(client.baseURL))

	token, err := extractCSRFToken(res)
	if err != nil {
		return err
	}

	loginValues := url.Values{}
	loginValues.Set("belt.csrf.token", token)
	loginValues.Set("username", username)
	loginValues.Set("password", password)

	req, err = http.NewRequestWithContext(ctx, http.MethodPost, client.baseURL.JoinPath("login").String(), strings.NewReader(loginValues.Encode()))
	if err != nil {
		return fmt.Errorf("error logging in: error constructing first login request: %w", err)
	}
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded ")

	res, err = client.c.Do(req)
	if err != nil {
		return fmt.Errorf("error logging in: error executing login request: %w", err)
	}

	if res.StatusCode != 200 {
		return fmt.Errorf("error logging in: %v %v", res.StatusCode, res.Status)
	}

	token, err = extractCSRFToken(res)
	if err != nil {
		return err
	}

	changePWValues := url.Values{}
	changePWValues.Set("belt.csrf.token", token)
	changePWValues.Set("current_password", password)
	changePWValues.Set("new_password", password+password)
	changePWValues.Set("repeat_new_password", password+password)

	req, err = http.NewRequestWithContext(ctx, http.MethodPost, client.baseURL.JoinPath("auth", "change_password").String(), strings.NewReader(changePWValues.Encode()))
	if err != nil {
		return fmt.Errorf("error logging in: error constructing change password request: %w", err)
	}
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded ")

	res, err = client.c.Do(req)
	if err != nil {
		return fmt.Errorf("error logging in: error executing change password request: %w", err)
	}

	if res.StatusCode != 200 {
		return fmt.Errorf("error logging in: %v %v", res.StatusCode, res.Status)
	}

	token, err = extractCSRFToken(res)
	if err != nil {
		return err
	}

	loginValues = url.Values{}
	loginValues.Set("belt.csrf.token", token)
	loginValues.Set("username", username)
	loginValues.Set("password", password+password)

	req, err = http.NewRequestWithContext(ctx, http.MethodPost, client.baseURL.JoinPath("login").String(), strings.NewReader(loginValues.Encode()))
	if err != nil {
		return fmt.Errorf("error logging in: error constructing second login request: %w", err)
	}
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded ")

	res, err = client.c.Do(req)
	if err != nil {
		return fmt.Errorf("error logging in: error executing second login request: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != 200 {
		return fmt.Errorf("error logging in: %v %v", res.StatusCode, res.Status)
	}

	return nil
}

var csrfPattern = regexp.MustCompile(`meta\s+name="csrf-token"\s+content="([A-Za-z0-9\+\-/=]+)"\s+/>`)

func extractCSRFToken(res *http.Response) (string, error) {
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return "", fmt.Errorf("error response reading body: %w", err)
	}

	matches := csrfPattern.FindAllSubmatch(body, 1)
	if len(matches) == 0 {
		return "", fmt.Errorf("unable to find CSRF token in response")
	}

	return string(matches[0][1]), nil
}

func waitForReady(url string) error {
	var lastErr error
	for count := 0; count < 10; count++ {
		res, err := http.Get(url + "/health") //nolint: noctx // this is test setup code, so this is okay
		if err != nil {
			lastErr = err
			time.Sleep(time.Millisecond * 500)
			continue
		}
		res.Body.Close()
		return nil
	}

	return lastErr
}
