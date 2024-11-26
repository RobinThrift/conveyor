package apiv1

import (
	"cmp"
	"compress/gzip"
	"context"
	"errors"
	"fmt"
	"net/http"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/control"
	"github.com/RobinThrift/belt/internal/domain"
	"github.com/RobinThrift/belt/internal/server/session"
)

type router struct {
	baseURL        string
	memoCtrl       *control.MemoControl
	attachmentCtrl *control.AttachmentControl
}

func New(baseURL string, mux *http.ServeMux, memoCtrl *control.MemoControl, attachmentCtrl *control.AttachmentControl) {
	r := &router{baseURL, memoCtrl, attachmentCtrl}

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

// (GET /memos/{id})
func (r *router) GetMemo(ctx context.Context, req GetMemoRequestObject) (GetMemoResponseObject, error) {
	memo, err := r.memoCtrl.GetMemo(ctx, domain.MemoID(req.Id))
	if err != nil {
		if errors.Is(err, domain.ErrMemoNotFound) {
			return nil, fmt.Errorf("%w: %v", errNotFound, err)
		}

		return nil, err
	}

	return GetMemo200JSONResponse{
		Id:         memo.ID.String(),
		Content:    string(memo.Content),
		IsArchived: memo.IsArchived,
		CreatedAt:  memo.CreatedAt,
		CreatedBy:  memo.CreatedBy.String(),
		UpdatedAt:  memo.UpdatedAt,
	}, nil
}

// (GET /memos)
func (r *router) ListMemos(ctx context.Context, req ListMemosRequestObject) (ListMemosResponseObject, error) {
	query := control.ListMemosQuery{
		PageSize:   min(cmp.Or(req.Params.PageSize, 10), 50),
		PageAfter:  req.Params.PageAfter,
		Tag:        req.Params.FilterTag,
		Search:     req.Params.FilterContent,
		IsArchived: req.Params.FilterIsArchived,
		IsDeleted:  req.Params.FilterIsDeleted,
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

// (PATCH /memos)
func (r *router) UpdateMemo(ctx context.Context, req UpdateMemoRequestObject) (UpdateMemoResponseObject, error) {
	cmd := control.UpdateMemoCmd{MemoID: domain.MemoID(req.Id)}

	if req.Body.Content != nil {
		cmd.Content = []byte(*req.Body.Content)
	}

	if req.Body.IsArchived != nil {
		cmd.IsArchived = req.Body.IsArchived
	}

	err := r.memoCtrl.UpdateMemo(ctx, cmd)
	if err != nil {
		if errors.Is(err, domain.ErrMemoNotFound) {
			return nil, fmt.Errorf("%w: %v", errNotFound, err)
		}
		return nil, err
	}

	return UpdateMemo204Response{}, nil
}

// (GET /tags)
func (r *router) ListTags(ctx context.Context, req ListTagsRequestObject) (ListTagsResponseObject, error) {
	query := control.ListTagsQuery{
		PageSize:  min(cmp.Or(req.Params.PageSize, 10), 50),
		PageAfter: req.Params.PageAfter,
	}

	tags, err := r.memoCtrl.ListTags(ctx, query)
	if err != nil {
		return nil, err
	}

	apiTags := TagList{Items: make([]Tag, len(tags.Items))}
	for i, tag := range tags.Items {
		apiTags.Items[i] = Tag{
			Count: float32(tag.Count),
			Tag:   tag.Tag,
		}
	}

	if tags.Next != nil {
		apiTags.Next = tags.Next
	}

	return ListTags200JSONResponse(apiTags), nil
}

// (GET /attachments)
func (r *router) ListAttachments(ctx context.Context, req ListAttachmentsRequestObject) (ListAttachmentsResponseObject, error) {
	query := control.ListAttachmentsQuery{
		PageSize:  min(cmp.Or(req.Params.PageSize, 10), 50),
		PageAfter: req.Params.PageAfter,
	}

	attachments, err := r.attachmentCtrl.ListAttachments(ctx, query)
	if err != nil {
		return nil, err
	}

	apiAttachments := AttachmentList{Items: make([]Attachment, len(attachments.Items))}
	for i, a := range attachments.Items {
		apiAttachments.Items[i] = Attachment{
			Url:              r.baseURL + "attachments" + a.Filepath,
			OriginalFilename: a.OriginalFilename,
			ContentType:      a.ContentType,
			Sha256:           fmt.Sprintf("%x", a.Sha256),
			SizeBytes:        a.SizeBytes,
			CreatedBy:        a.CreatedBy.String(),
			CreatedAt:        a.CreatedAt,
		}
	}

	if attachments.Next != nil {
		apiAttachments.Next = attachments.Next
	}

	return ListAttachments200JSONResponse(apiAttachments), nil
}

// (POST /attachments)
func (r *router) CreateAttachment(ctx context.Context, req CreateAttachmentRequestObject) (CreateAttachmentResponseObject, error) {
	content := req.Body
	if req.Params.ContentEncoding != nil && *req.Params.ContentEncoding == "gzip" {
		gr, err := gzip.NewReader(content)
		if err != nil {
			return nil, err
		}
		content = gr
		defer gr.Close()
	}

	id, err := r.attachmentCtrl.CreateAttachment(ctx, control.CreateAttachmentCmd{
		Filename: req.Params.XFilename,
		Content:  content,
	})
	if err != nil {
		return nil, err
	}

	created, err := r.attachmentCtrl.GetAttachment(ctx, id)
	if err != nil {
		if errors.Is(err, domain.ErrAttachmentNotFound) {
			return nil, fmt.Errorf("%w: %v", errNotFound, err)
		}
		return nil, err
	}

	return CreateAttachment201JSONResponse{
		Url:              r.baseURL + "attachments" + created.Filepath,
		OriginalFilename: created.OriginalFilename,
		ContentType:      created.ContentType,
		Sha256:           fmt.Sprintf("%x", created.Sha256),
		SizeBytes:        created.SizeBytes,
		CreatedAt:        created.CreatedAt,
		CreatedBy:        created.CreatedBy.String(),
	}, nil
}

// (DELETE /attachments/{filename})
func (r *router) DeleteAttachment(ctx context.Context, req DeleteAttachmentRequestObject) (DeleteAttachmentResponseObject, error) {
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
