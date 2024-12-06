package opengraph

import (
	"bufio"
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"
	"net/url"
	"path"
	"slices"
	"strings"
	"time"
	"unicode"

	"github.com/RobinThrift/belt/internal/control"
	"golang.org/x/net/html"
)

// OpenGraphPlugin fetched Open Graph Protocol (https://ogp.me/) information if the Memo content starts with a plain URL with not spaces
// and NOT other text, including tags. Subsequent lines may only contain tags.
// Leading and trailing Whitespace will be stripped.
type OpenGraphPlugin struct {
	baseURL        string
	attachmentCtrl *control.AttachmentControl
}

func NewOpenGraphPlugin(baseURL string, attachmentCtrl *control.AttachmentControl) *OpenGraphPlugin {
	return &OpenGraphPlugin{baseURL, attachmentCtrl}
}

func (*OpenGraphPlugin) Name() string {
	return "Memos.OpenGraphPlugin"
}

func (p *OpenGraphPlugin) MemoContentPlugin(ctx context.Context, content []byte) ([]byte, error) {
	orignalContent := bytes.TrimSpace(content)
	link := orignalContent
	end := len(link)
	if linebreak := bytes.Index(link, []byte("\n")); linebreak != -1 {
		link = link[:linebreak]
		end = linebreak
	}

	if len(link) == 0 {
		return content, nil
	}

	if bytes.ContainsFunc(link, unicode.IsSpace) {
		return content, nil
	}

	u, err := url.Parse(string(link))
	if err != nil {
		return content, nil
	}

	if shouldSkip(orignalContent[end:]) {
		return content, nil
	}

	info, err := fetchOpenGraphInfo(ctx, u)
	if err != nil {
		return content, err
	}

	if info == nil {
		return content, nil
	}

	if info.url == "" {
		info.url = u.String()
	}

	imgURL, err := p.fetchImg(ctx, info)
	if err != nil {
		return nil, err
	}
	info.image = imgURL

	return slices.Concat([]byte(info.String()), orignalContent[end:]), nil
}

func (p *OpenGraphPlugin) fetchImg(ctx context.Context, info *oginfo) (string, error) {
	if info.image == "" {
		return "", nil
	}

	if !strings.HasPrefix(info.image, "http") {
		u, err := url.Parse(info.url)
		if err != nil {
			return "", fmt.Errorf("error parsing site url %s: %w", info.url, err)
		}
		if info.image[0] == '/' {
			u.Path = info.image
		} else {
			u = u.JoinPath(info.image)
		}
		info.image = u.String()
	}

	ctx, cancel := context.WithTimeout(ctx, time.Second*5)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, info.image, nil)
	if err != nil {
		return "", fmt.Errorf("error constructing mage request for %s: %w", info.image, err)
	}

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("error requesting image at %s: %w", info.image, err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return "", fmt.Errorf("error getting image %s: %d %s", info.image, res.StatusCode, res.Status)
	}

	filename := path.Base(info.image)
	if path.Ext(filename) == "" {
		if exts, _ := mime.ExtensionsByType(res.Header.Get("content-type")); len(exts) != 0 {
			filename += exts[0]
		}
	}

	id, err := p.attachmentCtrl.CreateAttachment(ctx, control.CreateAttachmentCmd{
		Filename: filename,
		Content:  res.Body,
	})
	if err != nil {
		return "", fmt.Errorf("error creating attachment for image %s: %w", info.image, err)
	}

	attachment, err := p.attachmentCtrl.GetAttachment(ctx, id)
	if err != nil {
		return "", fmt.Errorf("error getting creating attachment %v: %w", id, err)
	}

	return attachment.URL(p.baseURL), nil
}

type oginfo struct {
	url         string
	siteName    string
	title       string
	description string
	image       string
	imageAlt    string
}

func (i *oginfo) String() string {
	return fmt.Sprintf(
		`::open-graph-link[%s]{title="%s - %s" description="%s" img="%s" alt="%s"}`,
		i.url,
		i.siteName,
		i.title,
		i.description,
		i.image,
		i.imageAlt,
	)
}

func fetchOpenGraphInfo(ctx context.Context, url *url.URL) (*oginfo, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("error constructing request for %s: %w", url.String(), err)
	}

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error requesting %s: %w", url.String(), err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error getting %s: %d %s", url.String(), res.StatusCode, res.Status)
	}

	info, err := newOGInfoFromHTMl(res.Body)
	if err != nil {
		return nil, fmt.Errorf("error parsing HTML response from %s: %w", url.String(), err)
	}

	return info, nil
}

func newOGInfoFromHTMl(body io.Reader) (*oginfo, error) {
	info := oginfo{}

	tokenizer := html.NewTokenizer(body)

	for {
		tt := tokenizer.Next()
		if errors.Is(tokenizer.Err(), io.EOF) {
			break
		}

		if tt == html.ErrorToken {
			return nil, tokenizer.Err()
		}

		tagName, _ := tokenizer.TagName()
		if tt == html.StartTagToken && bytes.Equal(tagName, []byte("body")) {
			break
		}

		if tt == html.EndTagToken && bytes.Equal(tagName, []byte("head")) {
			break
		}

		if (tt == html.SelfClosingTagToken || tt == html.StartTagToken) && bytes.Equal(tagName, []byte("meta")) {
			var property string
			var content string
			key, val, more := tokenizer.TagAttr()
			for {
				if bytes.Equal(key, []byte("property")) {
					property = string(val)
				} else if bytes.Equal(key, []byte("content")) {
					content = strings.ReplaceAll(string(val), `"`, "'")
				}
				if !more {
					break
				}
				key, val, more = tokenizer.TagAttr()
			}

			switch property {
			case "og:url":
				info.url = content
			case "og:site_name":
				info.siteName = content
			case "og:title":
				info.title = content
			case "og:description":
				info.description = content
			case "og:image":
				info.image = content
			case "og:image:alt":
				info.imageAlt = content
			}
		}
	}

	return &info, nil
}

func shouldSkip(content []byte) bool {
	scanner := bufio.NewScanner(bytes.NewReader(content))
	scanner.Split(bufio.ScanWords)

	for scanner.Scan() {
		if scanner.Bytes()[0] != '#' {
			return true
		}
	}

	return false
}
