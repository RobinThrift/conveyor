package syncv1

import (
	"compress/gzip"
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"go.robinthrift.com/conveyor/internal/auth"
	"go.robinthrift.com/conveyor/internal/control"
	"go.robinthrift.com/conveyor/internal/domain"
	"go.robinthrift.com/conveyor/internal/x/httperrors"
	"go.robinthrift.com/conveyor/internal/x/httpmiddleware"
)

type router struct {
	baseURL string

	syncCtrl       *control.SyncController
	accountFetcher AccountFetcher

	serveBlobHandler http.Handler

	errorHandler httperrors.ErrorHandlerFunc
}

type RouterConfig struct {
	BasePath string
}

type AccountFetcher interface {
	GetAccountForAuthToken(ctx context.Context, value auth.PlaintextAuthTokenValue) (*domain.Account, error)
}

func New(config RouterConfig, mux *http.ServeMux, syncCtrl *control.SyncController, accountFetcher AccountFetcher, blobFS http.FileSystem) {
	r := &router{
		baseURL: config.BasePath,

		syncCtrl:       syncCtrl,
		accountFetcher: accountFetcher,

		serveBlobHandler: http.FileServer(blobFS),
		errorHandler:     httperrors.ErrorHandler("conveyor/api/v1/sync"),
	}

	HandlerWithOptions(NewStrictHandlerWithOptions(r, nil, StrictHTTPServerOptions{
		RequestErrorHandlerFunc:  r.errorHandler,
		ResponseErrorHandlerFunc: r.errorHandler,
	}), StdHTTPServerOptions{
		BaseRouter:       mux,
		BaseURL:          config.BasePath + "api/sync/v1",
		ErrorHandlerFunc: r.errorHandler,
		Middlewares:      []MiddlewareFunc{httperrors.RecoverHandler, httpmiddleware.NewAuthMiddleware(accountFetcher, r.errorHandler, nil)},
	})

	mux.Handle(
		config.BasePath+"blobs/",
		r.checkAuth(
			httpmiddleware.GzipCompression(
				http.HandlerFunc(r.serveBlobs),
			),
		),
	)
}

func (router *router) serveBlobs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusNotFound)

		return
	}

	account := auth.AccountFromCtx(r.Context())
	if account == nil {
		w.WriteHeader(http.StatusNotFound)

		return
	}

	fixedReq := new(http.Request)
	*fixedReq = *r
	fixedReq.URL = new(url.URL)
	*fixedReq.URL = *r.URL
	fixedReq.URL.Path = fmt.Sprint(account.ID) + "/" + strings.TrimPrefix(r.URL.Path, router.baseURL+"blobs/")
	fixedReq.URL.RawPath = fmt.Sprint(account.ID) + "/" + strings.TrimPrefix(r.URL.RawPath, router.baseURL+"blobs/")

	router.serveBlobHandler.ServeHTTP(w, fixedReq)
}

// (POST /clients).
func (router *router) RegisterClient(ctx context.Context, req RegisterClientRequestObject) (RegisterClientResponseObject, error) {
	err := router.syncCtrl.RegisterClient(ctx, control.RegisterClientCmd{
		ClientID: domain.SyncClientID(req.Body.ClientID),
	})
	if err != nil {
		return nil, err
	}

	return RegisterClient201Response{}, nil
}

// (DELETE /clients/{id}).
func (router *router) UnregisterClient(ctx context.Context, req UnregisterClientRequestObject) (UnregisterClientResponseObject, error) {
	err := router.syncCtrl.UnregisterClient(ctx, control.UnregisterClientCmd{
		ClientID: domain.SyncClientID(req.Id),
	})
	if err != nil {
		return nil, err
	}

	return UnregisterClient201Response{}, nil
}

// (GET /full).
func (router *router) GetFullSync(ctx context.Context, _ GetFullSyncRequestObject) (GetFullSyncResponseObject, error) {
	entry, err := router.syncCtrl.GetLatestFullSyncEntry(ctx)
	if err != nil {
		if errors.Is(err, domain.ErrNoFullSyncEntriesFound) {
			return GetFullSync404JSONResponse{
				ErrorNotFoundJSONResponse: ErrorNotFoundJSONResponse{
					Code:   http.StatusNotFound,
					Title:  http.StatusText(http.StatusNotFound),
					Type:   "conveyor/api/sync/v1/NotFound",
					Detail: "No databases available for this accont",
				},
			}, nil
		}

		return nil, err
	}

	return GetFullSync303Response{
		Headers: GetFullSync303ResponseHeaders{
			Location: router.baseURL + "blobs/" + entry.Filepath,
		},
	}, nil
}

// (POST /full).
func (router *router) UploadFullSyncData(ctx context.Context, req UploadFullSyncDataRequestObject) (UploadFullSyncDataResponseObject, error) {
	err := router.syncCtrl.SaveFullDB(ctx, control.SaveFullDBCmd{Data: req.Body})
	if err != nil {
		return nil, err
	}

	return UploadFullSyncData201Response{}, nil
}

// (GET /changes).
func (router *router) ListChangelogEntries(ctx context.Context, req ListChangelogEntriesRequestObject) (ListChangelogEntriesResponseObject, error) {
	entries, err := router.syncCtrl.ListChangelogEntries(ctx, control.ListChangelogEntriesQuery{
		Since: req.Params.Since,
	})
	if err != nil {
		return nil, err
	}

	apiEntries := make([]EncryptedChangelogEntry, 0, len(entries))
	for _, entry := range entries {
		apiEntries = append(apiEntries, EncryptedChangelogEntry{
			SyncClientID: string(entry.SyncClientID),
			Data:         entry.Data,
			Timestamp:    entry.Timestamp,
		})
	}

	return ListChangelogEntries200JSONResponse{
		Items: apiEntries,
	}, nil
}

// (POST /changes).
func (router *router) CreateChangelogEntries(ctx context.Context, req CreateChangelogEntriesRequestObject) (CreateChangelogEntriesResponseObject, error) {
	entries := make([]domain.ChangelogEntry, 0, len(req.Body.Items))
	for _, entry := range req.Body.Items {
		entries = append(entries, domain.ChangelogEntry{
			SyncClientID: domain.SyncClientID(entry.SyncClientID),
			Data:         entry.Data,
			Timestamp:    entry.Timestamp,
		})
	}

	err := router.syncCtrl.CreateChangelogEntries(ctx, control.CreateChangelogEntriesCmd{
		Entries: entries,
	})
	if err != nil {
		return nil, err
	}

	return CreateChangelogEntries201Response{}, nil
}

// (POST /attachments/{filename}).
func (router *router) UploadAttachment(ctx context.Context, req UploadAttachmentRequestObject) (UploadAttachmentResponseObject, error) {
	content := req.Body
	if req.Params.ContentEncoding != nil && *req.Params.ContentEncoding == "gzip" {
		gr, err := gzip.NewReader(content)
		if err != nil {
			return nil, err
		}

		content = gr

		defer gr.Close()
	}

	err := router.syncCtrl.StoreAttachment(ctx, control.StoreAttachmentCmd{
		Filepath: req.Params.XFilepath,
		Content:  content,
	})
	if err != nil {
		return nil, err
	}

	return UploadAttachment201Response{}, nil
}

// (DELETE /attachments/{filename}).
func (router *router) DeleteAttachment(_ context.Context, _ DeleteAttachmentRequestObject) (DeleteAttachmentResponseObject, error) {
	return DeleteAttachment204Response{}, nil
}

func (router *router) checkAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, ok := authTokenFromHeader(r.Header)
		if !ok {
			router.errorHandler(w, r, auth.ErrUnauthorized)

			return
		}

		account, err := router.accountFetcher.GetAccountForAuthToken(r.Context(), *token)
		if account == nil || errors.Is(err, auth.ErrUnauthorized) {
			router.errorHandler(w, r, auth.ErrUnauthorized)

			return
		}

		if err != nil {
			router.errorHandler(w, r, &httperrors.Error{
				Code:  http.StatusInternalServerError,
				Title: http.StatusText(http.StatusInternalServerError),
				Type:  "conveyor/api/sync/v1/InternalServerError",
			})

			return
		}

		ctx := auth.CtxWithAccount(r.Context(), account)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

const authHeader = "Authorization"

func authTokenFromHeader(header http.Header) (*auth.PlaintextAuthTokenValue, bool) {
	token := header.Get(authHeader)
	if token == "" || token == "Bearer" {
		return nil, false
	}

	value, err := auth.NewPlaintextAuthTokenValueFromString(strings.TrimPrefix(token, "Bearer "))
	if err != nil {
		return nil, false
	}

	return value, true
}
