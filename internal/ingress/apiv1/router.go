package apiv1

import (
	"cmp"
	"context"
	"fmt"
	"net/http"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/control"
	"github.com/RobinThrift/belt/internal/server/session"
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
		Middlewares:      []MiddlewareFunc{recoverer, r.addAccountToContext},
	})
}

// (GET /memos)
func (r *router) ListMemos(ctx context.Context, req ListMemosRequestObject) (ListMemosResponseObject, error) {
	query := control.ListMemosQuery{
		PageSize:  min(cmp.Or(req.Params.PageSize, 10), 50),
		PageAfter: req.Params.PageAfter,
		Tag:       req.Params.FilterTag,
		Search:    req.Params.FilterContent,
	}

	if req.Params.FilterCreatedAt != nil {
		createdAtOp := "="
		if req.Params.OpCreatedAt != nil {
			createdAtOp = *(*string)(req.Params.OpCreatedAt)
		}

		switch createdAtOp {
		case "=":
			query.CreatedAt = &req.Params.FilterCreatedAt.Time
		case "<=":
			query.MinCreationDate = &req.Params.FilterCreatedAt.Time
		default:
			return nil, fmt.Errorf("%w: unknown operation '%s' for filter[created_at]", errInvalidRequest, createdAtOp)
		}
	}

	memos, err := r.memoCtrl.ListMemos(ctx, query)
	if err != nil {
		return nil, err
	}

	apiMemos := MemoList{Items: make([]Memo, len(memos.Items))}
	for i, memo := range memos.Items {
		apiMemos.Items[i] = Memo{
			Id:         memo.ID.String(),
			Content:    string(memo.Content),
			IsArchived: memo.IsArchived,
			CreatedAt:  memo.CreatedAt,
			CreatedBy:  memo.CreatedBy.String(),
			UpdatedAt:  memo.UpdatedAt,
		}
	}

	if memos.Next != nil {
		apiMemos.Next = memos.Next
	}

	return ListMemos200JSONResponse(apiMemos), nil
}

// (POST /memos)
func (r *router) CreateMemo(ctx context.Context, req CreateMemoRequestObject) (CreateMemoResponseObject, error) {
	cmd := control.CreateMemoCmd{
		Content: []byte(req.Body.Content),
	}

	if req.Body.CreatedAt != nil {
		cmd.CreatedAt = req.Body.CreatedAt
	}

	created, err := r.memoCtrl.CreateMemo(ctx, cmd)
	if err != nil {
		return nil, err
	}

	memo, err := r.memoCtrl.GetMemo(ctx, created)
	if err != nil {
		return nil, err
	}

	return CreateMemo201JSONResponse{
		Id:         memo.ID.String(),
		Content:    string(memo.Content),
		IsArchived: memo.IsArchived,
		CreatedAt:  memo.CreatedAt,
		CreatedBy:  memo.CreatedBy.String(),
		UpdatedAt:  memo.UpdatedAt,
	}, nil
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

func (r *router) addAccountToContext(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		account, ok := session.Get[*auth.Account](r.Context(), "account")
		if !ok {
			errorHandlerFunc(w, r, &Error{
				Code:  http.StatusUnauthorized,
				Title: http.StatusText(http.StatusUnauthorized),
				Type:  "belt/api/v1/Unauthorized",
			})
			return
		}

		ctx := auth.CtxWithAccount(r.Context(), account)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// func paginationFromParams[T ~int64](pageAfter *string, pageSize uint64) (actualPageAfter *T, actualPageSize uint64, err error) {
// 	actualPageSize = min(cmp.Or(pageSize, 10), 50)
//
// 	if pageAfter != nil {
// 		id, err := strconv.ParseInt(*pageAfter, 10, 64)
// 		if err != nil {
// 			return actualPageAfter, actualPageSize, fmt.Errorf("%w: %v", errInvalidRequest, err)
// 		}
// 		asT := T(id)
// 		actualPageAfter = &asT
// 	}
//
// 	return actualPageAfter, actualPageSize, nil
// }
