package memosv1

import (
	"compress/gzip"
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"go.robinthrift.com/belt/internal/auth"
	"go.robinthrift.com/belt/internal/control"
	"go.robinthrift.com/belt/internal/domain"
	"go.robinthrift.com/belt/internal/ingress/syncv1"
	"go.robinthrift.com/belt/internal/x/httperrors"
	"go.robinthrift.com/belt/internal/x/httpmiddleware"
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
		errorHandler:   httperrors.ErrorHandler("belt/api/memos/v1"),
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

// Create a new memo.
// (POST /memos)
func (router *router) CreateMemo(ctx context.Context, req CreateMemoRequestObject) (CreateMemoResponseObject, error) {
	if req.Body == nil {
		return nil, httperrors.ErrBadRequest
	}

	var body struct {
		PlaintextMemo
		syncv1.EncryptedChangelogEntry
	}

	err := json.Unmarshal(req.Body.union, &body)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", httperrors.ErrBadRequest, err)
	}

	var cmd control.CreateMemoChangelogEntryCmd
	switch {
	case body.Content != "":
		cmd.PlaintextMemo = &control.PlaintextMemo{
			Content:   body.Content,
			CreatedAt: body.CreatedAt,
		}
	case len(body.Data) != 0:
		cmd.Memo = &domain.ChangelogEntry{
			SyncClientID: domain.SyncClientID(body.SyncClientID),
			Data:         body.Data,
			Timestamp:    body.Timestamp,
		}
	default:
		return nil, httperrors.ErrBadRequest
	}

	err = router.syncCtrl.CreateMemoChangelogEntry(ctx, cmd)
	if err != nil {
		return nil, err
	}

	return CreateMemo201Response{}, nil
}

// Upload an attachment
// (POST /attachments)
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
