package apiv1

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/RobinThrift/belt/internal/control"
)

type router struct {
	memoCtrl *control.MemoControl
}

func New(baseURL string, mux *http.ServeMux, memoCtrl *control.MemoControl) {
	r := &router{memoCtrl: memoCtrl}

	HandlerWithOptions(NewStrictHandlerWithOptions(r, nil, StrictHTTPServerOptions{
		RequestErrorHandlerFunc:  errorHandlerFunc,
		ResponseErrorHandlerFunc: errorHandlerFunc,
	}), StdHTTPServerOptions{
		BaseRouter:       mux,
		BaseURL:          baseURL + "api/v1",
		ErrorHandlerFunc: errorHandlerFunc,
		Middlewares:      []MiddlewareFunc{recoverer, r.ensureLoggedIn},
	})
}

// (GET /memos)
func (r *router) ListMemos(ctx context.Context, req ListMemosRequestObject) (ListMemosResponseObject, error) {
	panic("not implemented") // TODO: Implement
}

// (POST /memos)
func (r *router) CreateMemo(ctx context.Context, req CreateMemoRequestObject) (CreateMemoResponseObject, error) {
	panic("not implemented") // TODO: Implement
}

// (GET /tags)
func (r *router) ListTags(ctx context.Context, req ListTagsRequestObject) (ListTagsResponseObject, error) {
	panic("not implemented") // TODO: Implement
}

// (GET /attachments)
func (router *router) ListAttachments(ctx context.Context, req ListAttachmentsRequestObject) (ListAttachmentsResponseObject, error) {
	panic("not implemented") // TODO: Implement
}

// (POST /attachments)
func (router *router) CreateAttachment(ctx context.Context, req CreateAttachmentRequestObject) (CreateAttachmentResponseObject, error) {
	panic("not implemented") // TODO: Implement
}

func (r *router) ensureLoggedIn(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		slog.DebugContext(r.Context(), "running middleware restapi.router.ensureLoggedIn")

		// account := domain.AccountFromCtx(r.Context())
		// if account == nil {
		// 	logger.DebugContext(r.Context(), "restapi.router.ensureLoggedIn: no account in context")
		//
		// 	apiErr := Error{
		// 		Code:  http.StatusUnauthorized,
		// 		Title: http.StatusText(http.StatusUnauthorized),
		// 		Type:  "idm/api/v1/Unauthorized",
		// 	}
		//
		// 	b, err := json.Marshal(apiErr)
		// 	if err != nil {
		// 		logger.ErrorContext(r.Context(), "error while trying to marshal api error to json", slog.Any("error", err))
		// 		w.WriteHeader(http.StatusInternalServerError)
		// 		return
		// 	}
		//
		// 	w.WriteHeader(http.StatusUnauthorized)
		//
		// 	_, err = w.Write(b)
		// 	if err != nil {
		// 		logger.ErrorContext(r.Context(), "error while writing http response", slog.Any("error", err))
		// 		w.WriteHeader(http.StatusInternalServerError)
		// 		return
		// 	}
		//
		// 	return
		// }

		next.ServeHTTP(w, r)
	})
}
