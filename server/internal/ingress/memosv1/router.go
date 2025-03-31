package memosv1

import (
	"compress/gzip"
	"context"
	"net/http"

	"go.robinthrift.com/conveyor/internal/auth"
	"go.robinthrift.com/conveyor/internal/control"
	"go.robinthrift.com/conveyor/internal/domain"
	"go.robinthrift.com/conveyor/internal/x/httperrors"
	"go.robinthrift.com/conveyor/internal/x/httpmiddleware"
)

type router struct {
	syncCtrl       *control.SyncController
	accountFetcher AccountFetcher
	errorHandler   httperrors.ErrorHandlerFunc
}

type AccountFetcher interface {
	GetAccountForAuthToken(ctx context.Context, value auth.PlaintextAuthTokenValue) (*domain.Account, error)
}

func New(basePath string, mux *http.ServeMux, syncCtrl *control.SyncController, accountFetcher AccountFetcher) {
	r := &router{
		syncCtrl:       syncCtrl,
		accountFetcher: accountFetcher,
		errorHandler:   httperrors.ErrorHandler("conveyor/api/memos/v1"),
	}

	HandlerWithOptions(NewStrictHandlerWithOptions(r, nil, StrictHTTPServerOptions{
		RequestErrorHandlerFunc:  r.errorHandler,
		ResponseErrorHandlerFunc: r.errorHandler,
	}), StdHTTPServerOptions{
		BaseRouter:       mux,
		BaseURL:          basePath + "api/memos/v1",
		ErrorHandlerFunc: r.errorHandler,
		Middlewares:      []MiddlewareFunc{httperrors.RecoverHandler, httpmiddleware.NewAuthMiddleware(accountFetcher, r.errorHandler, nil)},
	})
}

// (POST /memos).
func (router *router) CreateMemo(ctx context.Context, req CreateMemoRequestObject) (CreateMemoResponseObject, error) {
	if req.Body == nil {
		return nil, httperrors.ErrBadRequest
	}

	var cmd control.CreateMemoChangelogEntryCmd

	switch {
	case req.Body.Content != "":
		cmd.PlaintextMemo = &control.PlaintextMemo{
			Content:   req.Body.Content,
			CreatedAt: req.Body.CreatedAt,
		}
	case len(req.Body.Data) != 0:
		cmd.Memo = &domain.ChangelogEntry{
			SyncClientID: domain.SyncClientID(req.Body.SyncClientID),
			Data:         req.Body.Data,
			Timestamp:    req.Body.Timestamp,
		}
	default:
		return nil, httperrors.ErrBadRequest
	}

	err := router.syncCtrl.CreateMemoChangelogEntry(ctx, cmd)
	if err != nil {
		return nil, err
	}

	return CreateMemo201Response{}, nil
}

// (POST /attachments).
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

	contentType := ""
	if req.Params.ContentType != nil {
		contentType = *req.Params.ContentType
	}

	id, err := router.syncCtrl.CreateAttachmentChangelogEntry(ctx, control.CreateAttachmentChangelogEntryCmd{
		OriginalFilename: req.Params.XFilename,
		ContentType:      contentType,
		Data:             content,
	})
	if err != nil {
		return nil, err
	}

	return UploadAttachment201JSONResponse{
		UploadAttachmentResponseJSONResponse: UploadAttachmentResponseJSONResponse{
			Id: id,
		},
	}, nil
}
