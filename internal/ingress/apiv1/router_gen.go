//lint:file-ignore ST1005 Ignore because generated code
//go:build go1.22

// Package apiv1 provides primitives to interact with the openapi HTTP API.
//
// Code generated by github.com/oapi-codegen/oapi-codegen/v2 version v2.4.1 DO NOT EDIT.
package apiv1

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/oapi-codegen/runtime"
	strictnethttp "github.com/oapi-codegen/runtime/strictmiddleware/nethttp"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

// Defines values for ListMemosParamsOpCreatedAt.
const (
	Equal         ListMemosParamsOpCreatedAt = "="
	LessThanEqual ListMemosParamsOpCreatedAt = "<="
)

// Attachment defines model for Attachment.
type Attachment struct {
	ContentType string    `json:"contentType"`
	CreatedAt   time.Time `json:"createdAt"`
	CreatedBy   string    `json:"createdBy"`
	Filename    string    `json:"filename"`
	Sha256      string    `json:"sha256"`
	SizeBytes   string    `json:"sizeBytes"`
	Url         string    `json:"url"`
}

// AttachmentList defines model for AttachmentList.
type AttachmentList struct {
	Items []Attachment `json:"items"`
	Next  string       `json:"next"`
}

// Error Follows RFC7807 (https://datatracker.ietf.org/doc/html/rfc7807)
type Error struct {
	Code   int    `json:"code"`
	Detail string `json:"detail"`
	Title  string `json:"title"`
	Type   string `json:"type"`
}

// Memo defines model for Memo.
type Memo struct {
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"createdAt"`
	CreatedBy  string    `json:"createdBy"`
	Id         string    `json:"id"`
	IsArchived bool      `json:"isArchived"`
	Name       string    `json:"name"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// MemoList defines model for MemoList.
type MemoList struct {
	Items []Memo     `json:"items"`
	Next  *time.Time `json:"next,omitempty"`
}

// Tag defines model for Tag.
type Tag struct {
	Count float32 `json:"count"`
	Tag   string  `json:"tag"`
}

// TagList defines model for TagList.
type TagList struct {
	Items []Tag   `json:"items"`
	Next  *string `json:"next,omitempty"`
}

// CreateMemoRequest defines model for CreateMemoRequest.
type CreateMemoRequest struct {
	Content   string     `json:"content"`
	CreatedAt *time.Time `json:"createdAt,omitempty"`
}

// UpdateMemoRequest defines model for UpdateMemoRequest.
type UpdateMemoRequest struct {
	Content    *string `json:"content,omitempty"`
	IsArchived *bool   `json:"isArchived,omitempty"`
}

// ListAttachmentsParams defines parameters for ListAttachments.
type ListAttachmentsParams struct {
	PageSize  uint64  `form:"page[size]" json:"page[size]"`
	PageAfter *string `form:"page[after],omitempty" json:"page[after],omitempty"`
}

// CreateAttachmentParams defines parameters for CreateAttachment.
type CreateAttachmentParams struct {
	XFilename string `json:"X-Filename"`
}

// ListMemosParams defines parameters for ListMemos.
type ListMemosParams struct {
	PageSize         uint64                      `form:"page[size]" json:"page[size]"`
	PageAfter        *time.Time                  `form:"page[after],omitempty" json:"page[after],omitempty"`
	FilterContent    *string                     `form:"filter[content],omitempty" json:"filter[content],omitempty"`
	FilterTag        *string                     `form:"filter[tag],omitempty" json:"filter[tag],omitempty"`
	FilterCreatedAt  *openapi_types.Date         `form:"filter[created_at],omitempty" json:"filter[created_at],omitempty"`
	OpCreatedAt      *ListMemosParamsOpCreatedAt `form:"op[created_at],omitempty" json:"op[created_at],omitempty"`
	FilterIsArchived *bool                       `form:"filter[is_archived],omitempty" json:"filter[is_archived],omitempty"`
}

// ListMemosParamsOpCreatedAt defines parameters for ListMemos.
type ListMemosParamsOpCreatedAt string

// CreateMemoJSONBody defines parameters for CreateMemo.
type CreateMemoJSONBody struct {
	Content   string     `json:"content"`
	CreatedAt *time.Time `json:"createdAt,omitempty"`
}

// UpdateMemoJSONBody defines parameters for UpdateMemo.
type UpdateMemoJSONBody struct {
	Content    *string `json:"content,omitempty"`
	IsArchived *bool   `json:"isArchived,omitempty"`
}

// ListTagsParams defines parameters for ListTags.
type ListTagsParams struct {
	PageSize     uint64  `form:"page[size]" json:"page[size]"`
	PageAfter    *string `form:"page[after],omitempty" json:"page[after],omitempty"`
	FilterPrefix *string `form:"filter[prefix],omitempty" json:"filter[prefix],omitempty"`
}

// CreateMemoJSONRequestBody defines body for CreateMemo for application/json ContentType.
type CreateMemoJSONRequestBody CreateMemoJSONBody

// UpdateMemoJSONRequestBody defines body for UpdateMemo for application/json ContentType.
type UpdateMemoJSONRequestBody UpdateMemoJSONBody

// ServerInterface represents all server handlers.
type ServerInterface interface {

	// (GET /attachments)
	ListAttachments(w http.ResponseWriter, r *http.Request, params ListAttachmentsParams)

	// (POST /attachments)
	CreateAttachment(w http.ResponseWriter, r *http.Request, params CreateAttachmentParams)

	// (GET /memos)
	ListMemos(w http.ResponseWriter, r *http.Request, params ListMemosParams)

	// (POST /memos)
	CreateMemo(w http.ResponseWriter, r *http.Request)

	// (PATCH /memos/{id})
	UpdateMemo(w http.ResponseWriter, r *http.Request, id int64)

	// (GET /tags)
	ListTags(w http.ResponseWriter, r *http.Request, params ListTagsParams)
}

// ServerInterfaceWrapper converts contexts to parameters.
type ServerInterfaceWrapper struct {
	Handler            ServerInterface
	HandlerMiddlewares []MiddlewareFunc
	ErrorHandlerFunc   func(w http.ResponseWriter, r *http.Request, err error)
}

type MiddlewareFunc func(http.Handler) http.Handler

// ListAttachments operation middleware
func (siw *ServerInterfaceWrapper) ListAttachments(w http.ResponseWriter, r *http.Request) {

	var err error

	// Parameter object where we will unmarshal all parameters from the context
	var params ListAttachmentsParams

	// ------------- Required query parameter "page[size]" -------------

	if paramValue := r.URL.Query().Get("page[size]"); paramValue != "" {

	} else {
		siw.ErrorHandlerFunc(w, r, &RequiredParamError{ParamName: "page[size]"})
		return
	}

	err = runtime.BindQueryParameter("form", true, true, "page[size]", r.URL.Query(), &params.PageSize)
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "page[size]", Err: err})
		return
	}

	// ------------- Optional query parameter "page[after]" -------------

	err = runtime.BindQueryParameter("form", true, false, "page[after]", r.URL.Query(), &params.PageAfter)
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "page[after]", Err: err})
		return
	}

	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.ListAttachments(w, r, params)
	}))

	for _, middleware := range siw.HandlerMiddlewares {
		handler = middleware(handler)
	}

	handler.ServeHTTP(w, r)
}

// CreateAttachment operation middleware
func (siw *ServerInterfaceWrapper) CreateAttachment(w http.ResponseWriter, r *http.Request) {

	var err error

	// Parameter object where we will unmarshal all parameters from the context
	var params CreateAttachmentParams

	headers := r.Header

	// ------------- Required header parameter "X-Filename" -------------
	if valueList, found := headers[http.CanonicalHeaderKey("X-Filename")]; found {
		var XFilename string
		n := len(valueList)
		if n != 1 {
			siw.ErrorHandlerFunc(w, r, &TooManyValuesForParamError{ParamName: "X-Filename", Count: n})
			return
		}

		err = runtime.BindStyledParameterWithOptions("simple", "X-Filename", valueList[0], &XFilename, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationHeader, Explode: false, Required: true})
		if err != nil {
			siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "X-Filename", Err: err})
			return
		}

		params.XFilename = XFilename

	} else {
		err := fmt.Errorf("Header parameter X-Filename is required, but not found")
		siw.ErrorHandlerFunc(w, r, &RequiredHeaderError{ParamName: "X-Filename", Err: err})
		return
	}

	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.CreateAttachment(w, r, params)
	}))

	for _, middleware := range siw.HandlerMiddlewares {
		handler = middleware(handler)
	}

	handler.ServeHTTP(w, r)
}

// ListMemos operation middleware
func (siw *ServerInterfaceWrapper) ListMemos(w http.ResponseWriter, r *http.Request) {

	var err error

	// Parameter object where we will unmarshal all parameters from the context
	var params ListMemosParams

	// ------------- Required query parameter "page[size]" -------------

	if paramValue := r.URL.Query().Get("page[size]"); paramValue != "" {

	} else {
		siw.ErrorHandlerFunc(w, r, &RequiredParamError{ParamName: "page[size]"})
		return
	}

	err = runtime.BindQueryParameter("form", true, true, "page[size]", r.URL.Query(), &params.PageSize)
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "page[size]", Err: err})
		return
	}

	// ------------- Optional query parameter "page[after]" -------------

	err = runtime.BindQueryParameter("form", true, false, "page[after]", r.URL.Query(), &params.PageAfter)
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "page[after]", Err: err})
		return
	}

	// ------------- Optional query parameter "filter[content]" -------------

	err = runtime.BindQueryParameter("form", true, false, "filter[content]", r.URL.Query(), &params.FilterContent)
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "filter[content]", Err: err})
		return
	}

	// ------------- Optional query parameter "filter[tag]" -------------

	err = runtime.BindQueryParameter("form", true, false, "filter[tag]", r.URL.Query(), &params.FilterTag)
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "filter[tag]", Err: err})
		return
	}

	// ------------- Optional query parameter "filter[created_at]" -------------

	err = runtime.BindQueryParameter("form", true, false, "filter[created_at]", r.URL.Query(), &params.FilterCreatedAt)
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "filter[created_at]", Err: err})
		return
	}

	// ------------- Optional query parameter "op[created_at]" -------------

	err = runtime.BindQueryParameter("form", true, false, "op[created_at]", r.URL.Query(), &params.OpCreatedAt)
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "op[created_at]", Err: err})
		return
	}

	// ------------- Optional query parameter "filter[is_archived]" -------------

	err = runtime.BindQueryParameter("form", true, false, "filter[is_archived]", r.URL.Query(), &params.FilterIsArchived)
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "filter[is_archived]", Err: err})
		return
	}

	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.ListMemos(w, r, params)
	}))

	for _, middleware := range siw.HandlerMiddlewares {
		handler = middleware(handler)
	}

	handler.ServeHTTP(w, r)
}

// CreateMemo operation middleware
func (siw *ServerInterfaceWrapper) CreateMemo(w http.ResponseWriter, r *http.Request) {

	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.CreateMemo(w, r)
	}))

	for _, middleware := range siw.HandlerMiddlewares {
		handler = middleware(handler)
	}

	handler.ServeHTTP(w, r)
}

// UpdateMemo operation middleware
func (siw *ServerInterfaceWrapper) UpdateMemo(w http.ResponseWriter, r *http.Request) {

	var err error

	// ------------- Path parameter "id" -------------
	var id int64

	err = runtime.BindStyledParameterWithOptions("simple", "id", r.PathValue("id"), &id, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationPath, Explode: false, Required: true})
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "id", Err: err})
		return
	}

	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.UpdateMemo(w, r, id)
	}))

	for _, middleware := range siw.HandlerMiddlewares {
		handler = middleware(handler)
	}

	handler.ServeHTTP(w, r)
}

// ListTags operation middleware
func (siw *ServerInterfaceWrapper) ListTags(w http.ResponseWriter, r *http.Request) {

	var err error

	// Parameter object where we will unmarshal all parameters from the context
	var params ListTagsParams

	// ------------- Required query parameter "page[size]" -------------

	if paramValue := r.URL.Query().Get("page[size]"); paramValue != "" {

	} else {
		siw.ErrorHandlerFunc(w, r, &RequiredParamError{ParamName: "page[size]"})
		return
	}

	err = runtime.BindQueryParameter("form", true, true, "page[size]", r.URL.Query(), &params.PageSize)
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "page[size]", Err: err})
		return
	}

	// ------------- Optional query parameter "page[after]" -------------

	err = runtime.BindQueryParameter("form", true, false, "page[after]", r.URL.Query(), &params.PageAfter)
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "page[after]", Err: err})
		return
	}

	// ------------- Optional query parameter "filter[prefix]" -------------

	err = runtime.BindQueryParameter("form", true, false, "filter[prefix]", r.URL.Query(), &params.FilterPrefix)
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "filter[prefix]", Err: err})
		return
	}

	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.ListTags(w, r, params)
	}))

	for _, middleware := range siw.HandlerMiddlewares {
		handler = middleware(handler)
	}

	handler.ServeHTTP(w, r)
}

type UnescapedCookieParamError struct {
	ParamName string
	Err       error
}

func (e *UnescapedCookieParamError) Error() string {
	return fmt.Sprintf("error unescaping cookie parameter '%s'", e.ParamName)
}

func (e *UnescapedCookieParamError) Unwrap() error {
	return e.Err
}

type UnmarshalingParamError struct {
	ParamName string
	Err       error
}

func (e *UnmarshalingParamError) Error() string {
	return fmt.Sprintf("Error unmarshaling parameter %s as JSON: %s", e.ParamName, e.Err.Error())
}

func (e *UnmarshalingParamError) Unwrap() error {
	return e.Err
}

type RequiredParamError struct {
	ParamName string
}

func (e *RequiredParamError) Error() string {
	return fmt.Sprintf("Query argument %s is required, but not found", e.ParamName)
}

type RequiredHeaderError struct {
	ParamName string
	Err       error
}

func (e *RequiredHeaderError) Error() string {
	return fmt.Sprintf("Header parameter %s is required, but not found", e.ParamName)
}

func (e *RequiredHeaderError) Unwrap() error {
	return e.Err
}

type InvalidParamFormatError struct {
	ParamName string
	Err       error
}

func (e *InvalidParamFormatError) Error() string {
	return fmt.Sprintf("Invalid format for parameter %s: %s", e.ParamName, e.Err.Error())
}

func (e *InvalidParamFormatError) Unwrap() error {
	return e.Err
}

type TooManyValuesForParamError struct {
	ParamName string
	Count     int
}

func (e *TooManyValuesForParamError) Error() string {
	return fmt.Sprintf("Expected one value for %s, got %d", e.ParamName, e.Count)
}

// Handler creates http.Handler with routing matching OpenAPI spec.
func Handler(si ServerInterface) http.Handler {
	return HandlerWithOptions(si, StdHTTPServerOptions{})
}

// ServeMux is an abstraction of http.ServeMux.
type ServeMux interface {
	HandleFunc(pattern string, handler func(http.ResponseWriter, *http.Request))
	ServeHTTP(w http.ResponseWriter, r *http.Request)
}

type StdHTTPServerOptions struct {
	BaseURL          string
	BaseRouter       ServeMux
	Middlewares      []MiddlewareFunc
	ErrorHandlerFunc func(w http.ResponseWriter, r *http.Request, err error)
}

// HandlerFromMux creates http.Handler with routing matching OpenAPI spec based on the provided mux.
func HandlerFromMux(si ServerInterface, m ServeMux) http.Handler {
	return HandlerWithOptions(si, StdHTTPServerOptions{
		BaseRouter: m,
	})
}

func HandlerFromMuxWithBaseURL(si ServerInterface, m ServeMux, baseURL string) http.Handler {
	return HandlerWithOptions(si, StdHTTPServerOptions{
		BaseURL:    baseURL,
		BaseRouter: m,
	})
}

// HandlerWithOptions creates http.Handler with additional options
func HandlerWithOptions(si ServerInterface, options StdHTTPServerOptions) http.Handler {
	m := options.BaseRouter

	if m == nil {
		m = http.NewServeMux()
	}
	if options.ErrorHandlerFunc == nil {
		options.ErrorHandlerFunc = func(w http.ResponseWriter, r *http.Request, err error) {
			http.Error(w, err.Error(), http.StatusBadRequest)
		}
	}

	wrapper := ServerInterfaceWrapper{
		Handler:            si,
		HandlerMiddlewares: options.Middlewares,
		ErrorHandlerFunc:   options.ErrorHandlerFunc,
	}

	m.HandleFunc("GET "+options.BaseURL+"/attachments", wrapper.ListAttachments)
	m.HandleFunc("POST "+options.BaseURL+"/attachments", wrapper.CreateAttachment)
	m.HandleFunc("GET "+options.BaseURL+"/memos", wrapper.ListMemos)
	m.HandleFunc("POST "+options.BaseURL+"/memos", wrapper.CreateMemo)
	m.HandleFunc("PATCH "+options.BaseURL+"/memos/{id}", wrapper.UpdateMemo)
	m.HandleFunc("GET "+options.BaseURL+"/tags", wrapper.ListTags)

	return m
}

type ListAttachmentsRequestObject struct {
	Params ListAttachmentsParams
}

type ListAttachmentsResponseObject interface {
	VisitListAttachmentsResponse(w http.ResponseWriter) error
}

type ListAttachments200JSONResponse AttachmentList

func (response ListAttachments200JSONResponse) VisitListAttachmentsResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)

	return json.NewEncoder(w).Encode(response)
}

type ListAttachments400JSONResponse Error

func (response ListAttachments400JSONResponse) VisitListAttachmentsResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(400)

	return json.NewEncoder(w).Encode(response)
}

type ListAttachments401JSONResponse Error

func (response ListAttachments401JSONResponse) VisitListAttachmentsResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(401)

	return json.NewEncoder(w).Encode(response)
}

type ListAttachmentsdefaultJSONResponse struct {
	Body       Error
	StatusCode int
}

func (response ListAttachmentsdefaultJSONResponse) VisitListAttachmentsResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(response.StatusCode)

	return json.NewEncoder(w).Encode(response.Body)
}

type CreateAttachmentRequestObject struct {
	Params CreateAttachmentParams
	Body   io.Reader
}

type CreateAttachmentResponseObject interface {
	VisitCreateAttachmentResponse(w http.ResponseWriter) error
}

type CreateAttachment201JSONResponse Attachment

func (response CreateAttachment201JSONResponse) VisitCreateAttachmentResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(201)

	return json.NewEncoder(w).Encode(response)
}

type CreateAttachment400JSONResponse Error

func (response CreateAttachment400JSONResponse) VisitCreateAttachmentResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(400)

	return json.NewEncoder(w).Encode(response)
}

type CreateAttachment401JSONResponse Error

func (response CreateAttachment401JSONResponse) VisitCreateAttachmentResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(401)

	return json.NewEncoder(w).Encode(response)
}

type CreateAttachmentdefaultJSONResponse struct {
	Body       Error
	StatusCode int
}

func (response CreateAttachmentdefaultJSONResponse) VisitCreateAttachmentResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(response.StatusCode)

	return json.NewEncoder(w).Encode(response.Body)
}

type ListMemosRequestObject struct {
	Params ListMemosParams
}

type ListMemosResponseObject interface {
	VisitListMemosResponse(w http.ResponseWriter) error
}

type ListMemos200JSONResponse MemoList

func (response ListMemos200JSONResponse) VisitListMemosResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)

	return json.NewEncoder(w).Encode(response)
}

type CreateMemoRequestObject struct {
	Body *CreateMemoJSONRequestBody
}

type CreateMemoResponseObject interface {
	VisitCreateMemoResponse(w http.ResponseWriter) error
}

type CreateMemo201JSONResponse Memo

func (response CreateMemo201JSONResponse) VisitCreateMemoResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(201)

	return json.NewEncoder(w).Encode(response)
}

type CreateMemo400JSONResponse Error

func (response CreateMemo400JSONResponse) VisitCreateMemoResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(400)

	return json.NewEncoder(w).Encode(response)
}

type CreateMemo401JSONResponse Error

func (response CreateMemo401JSONResponse) VisitCreateMemoResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(401)

	return json.NewEncoder(w).Encode(response)
}

type CreateMemodefaultJSONResponse struct {
	Body       Error
	StatusCode int
}

func (response CreateMemodefaultJSONResponse) VisitCreateMemoResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(response.StatusCode)

	return json.NewEncoder(w).Encode(response.Body)
}

type UpdateMemoRequestObject struct {
	Id   int64 `json:"id"`
	Body *UpdateMemoJSONRequestBody
}

type UpdateMemoResponseObject interface {
	VisitUpdateMemoResponse(w http.ResponseWriter) error
}

type UpdateMemo204Response struct {
}

func (response UpdateMemo204Response) VisitUpdateMemoResponse(w http.ResponseWriter) error {
	w.WriteHeader(204)
	return nil
}

type UpdateMemo400JSONResponse Error

func (response UpdateMemo400JSONResponse) VisitUpdateMemoResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(400)

	return json.NewEncoder(w).Encode(response)
}

type UpdateMemo401JSONResponse Error

func (response UpdateMemo401JSONResponse) VisitUpdateMemoResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(401)

	return json.NewEncoder(w).Encode(response)
}

type UpdateMemodefaultJSONResponse struct {
	Body       Error
	StatusCode int
}

func (response UpdateMemodefaultJSONResponse) VisitUpdateMemoResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(response.StatusCode)

	return json.NewEncoder(w).Encode(response.Body)
}

type ListTagsRequestObject struct {
	Params ListTagsParams
}

type ListTagsResponseObject interface {
	VisitListTagsResponse(w http.ResponseWriter) error
}

type ListTags200JSONResponse TagList

func (response ListTags200JSONResponse) VisitListTagsResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)

	return json.NewEncoder(w).Encode(response)
}

type ListTags400JSONResponse Error

func (response ListTags400JSONResponse) VisitListTagsResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(400)

	return json.NewEncoder(w).Encode(response)
}

type ListTags401JSONResponse Error

func (response ListTags401JSONResponse) VisitListTagsResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(401)

	return json.NewEncoder(w).Encode(response)
}

type ListTagsdefaultJSONResponse struct {
	Body       Error
	StatusCode int
}

func (response ListTagsdefaultJSONResponse) VisitListTagsResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(response.StatusCode)

	return json.NewEncoder(w).Encode(response.Body)
}

// StrictServerInterface represents all server handlers.
type StrictServerInterface interface {

	// (GET /attachments)
	ListAttachments(ctx context.Context, request ListAttachmentsRequestObject) (ListAttachmentsResponseObject, error)

	// (POST /attachments)
	CreateAttachment(ctx context.Context, request CreateAttachmentRequestObject) (CreateAttachmentResponseObject, error)

	// (GET /memos)
	ListMemos(ctx context.Context, request ListMemosRequestObject) (ListMemosResponseObject, error)

	// (POST /memos)
	CreateMemo(ctx context.Context, request CreateMemoRequestObject) (CreateMemoResponseObject, error)

	// (PATCH /memos/{id})
	UpdateMemo(ctx context.Context, request UpdateMemoRequestObject) (UpdateMemoResponseObject, error)

	// (GET /tags)
	ListTags(ctx context.Context, request ListTagsRequestObject) (ListTagsResponseObject, error)
}

type StrictHandlerFunc = strictnethttp.StrictHTTPHandlerFunc
type StrictMiddlewareFunc = strictnethttp.StrictHTTPMiddlewareFunc

type StrictHTTPServerOptions struct {
	RequestErrorHandlerFunc  func(w http.ResponseWriter, r *http.Request, err error)
	ResponseErrorHandlerFunc func(w http.ResponseWriter, r *http.Request, err error)
}

func NewStrictHandler(ssi StrictServerInterface, middlewares []StrictMiddlewareFunc) ServerInterface {
	return &strictHandler{ssi: ssi, middlewares: middlewares, options: StrictHTTPServerOptions{
		RequestErrorHandlerFunc: func(w http.ResponseWriter, r *http.Request, err error) {
			http.Error(w, err.Error(), http.StatusBadRequest)
		},
		ResponseErrorHandlerFunc: func(w http.ResponseWriter, r *http.Request, err error) {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		},
	}}
}

func NewStrictHandlerWithOptions(ssi StrictServerInterface, middlewares []StrictMiddlewareFunc, options StrictHTTPServerOptions) ServerInterface {
	return &strictHandler{ssi: ssi, middlewares: middlewares, options: options}
}

type strictHandler struct {
	ssi         StrictServerInterface
	middlewares []StrictMiddlewareFunc
	options     StrictHTTPServerOptions
}

// ListAttachments operation middleware
func (sh *strictHandler) ListAttachments(w http.ResponseWriter, r *http.Request, params ListAttachmentsParams) {
	var request ListAttachmentsRequestObject

	request.Params = params

	handler := func(ctx context.Context, w http.ResponseWriter, r *http.Request, request interface{}) (interface{}, error) {
		return sh.ssi.ListAttachments(ctx, request.(ListAttachmentsRequestObject))
	}
	for _, middleware := range sh.middlewares {
		handler = middleware(handler, "ListAttachments")
	}

	response, err := handler(r.Context(), w, r, request)

	if err != nil {
		sh.options.ResponseErrorHandlerFunc(w, r, err)
	} else if validResponse, ok := response.(ListAttachmentsResponseObject); ok {
		if err := validResponse.VisitListAttachmentsResponse(w); err != nil {
			sh.options.ResponseErrorHandlerFunc(w, r, err)
		}
	} else if response != nil {
		sh.options.ResponseErrorHandlerFunc(w, r, fmt.Errorf("unexpected response type: %T", response))
	}
}

// CreateAttachment operation middleware
func (sh *strictHandler) CreateAttachment(w http.ResponseWriter, r *http.Request, params CreateAttachmentParams) {
	var request CreateAttachmentRequestObject

	request.Params = params

	request.Body = r.Body

	handler := func(ctx context.Context, w http.ResponseWriter, r *http.Request, request interface{}) (interface{}, error) {
		return sh.ssi.CreateAttachment(ctx, request.(CreateAttachmentRequestObject))
	}
	for _, middleware := range sh.middlewares {
		handler = middleware(handler, "CreateAttachment")
	}

	response, err := handler(r.Context(), w, r, request)

	if err != nil {
		sh.options.ResponseErrorHandlerFunc(w, r, err)
	} else if validResponse, ok := response.(CreateAttachmentResponseObject); ok {
		if err := validResponse.VisitCreateAttachmentResponse(w); err != nil {
			sh.options.ResponseErrorHandlerFunc(w, r, err)
		}
	} else if response != nil {
		sh.options.ResponseErrorHandlerFunc(w, r, fmt.Errorf("unexpected response type: %T", response))
	}
}

// ListMemos operation middleware
func (sh *strictHandler) ListMemos(w http.ResponseWriter, r *http.Request, params ListMemosParams) {
	var request ListMemosRequestObject

	request.Params = params

	handler := func(ctx context.Context, w http.ResponseWriter, r *http.Request, request interface{}) (interface{}, error) {
		return sh.ssi.ListMemos(ctx, request.(ListMemosRequestObject))
	}
	for _, middleware := range sh.middlewares {
		handler = middleware(handler, "ListMemos")
	}

	response, err := handler(r.Context(), w, r, request)

	if err != nil {
		sh.options.ResponseErrorHandlerFunc(w, r, err)
	} else if validResponse, ok := response.(ListMemosResponseObject); ok {
		if err := validResponse.VisitListMemosResponse(w); err != nil {
			sh.options.ResponseErrorHandlerFunc(w, r, err)
		}
	} else if response != nil {
		sh.options.ResponseErrorHandlerFunc(w, r, fmt.Errorf("unexpected response type: %T", response))
	}
}

// CreateMemo operation middleware
func (sh *strictHandler) CreateMemo(w http.ResponseWriter, r *http.Request) {
	var request CreateMemoRequestObject

	var body CreateMemoJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		sh.options.RequestErrorHandlerFunc(w, r, fmt.Errorf("can't decode JSON body: %w", err))
		return
	}
	request.Body = &body

	handler := func(ctx context.Context, w http.ResponseWriter, r *http.Request, request interface{}) (interface{}, error) {
		return sh.ssi.CreateMemo(ctx, request.(CreateMemoRequestObject))
	}
	for _, middleware := range sh.middlewares {
		handler = middleware(handler, "CreateMemo")
	}

	response, err := handler(r.Context(), w, r, request)

	if err != nil {
		sh.options.ResponseErrorHandlerFunc(w, r, err)
	} else if validResponse, ok := response.(CreateMemoResponseObject); ok {
		if err := validResponse.VisitCreateMemoResponse(w); err != nil {
			sh.options.ResponseErrorHandlerFunc(w, r, err)
		}
	} else if response != nil {
		sh.options.ResponseErrorHandlerFunc(w, r, fmt.Errorf("unexpected response type: %T", response))
	}
}

// UpdateMemo operation middleware
func (sh *strictHandler) UpdateMemo(w http.ResponseWriter, r *http.Request, id int64) {
	var request UpdateMemoRequestObject

	request.Id = id

	var body UpdateMemoJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		sh.options.RequestErrorHandlerFunc(w, r, fmt.Errorf("can't decode JSON body: %w", err))
		return
	}
	request.Body = &body

	handler := func(ctx context.Context, w http.ResponseWriter, r *http.Request, request interface{}) (interface{}, error) {
		return sh.ssi.UpdateMemo(ctx, request.(UpdateMemoRequestObject))
	}
	for _, middleware := range sh.middlewares {
		handler = middleware(handler, "UpdateMemo")
	}

	response, err := handler(r.Context(), w, r, request)

	if err != nil {
		sh.options.ResponseErrorHandlerFunc(w, r, err)
	} else if validResponse, ok := response.(UpdateMemoResponseObject); ok {
		if err := validResponse.VisitUpdateMemoResponse(w); err != nil {
			sh.options.ResponseErrorHandlerFunc(w, r, err)
		}
	} else if response != nil {
		sh.options.ResponseErrorHandlerFunc(w, r, fmt.Errorf("unexpected response type: %T", response))
	}
}

// ListTags operation middleware
func (sh *strictHandler) ListTags(w http.ResponseWriter, r *http.Request, params ListTagsParams) {
	var request ListTagsRequestObject

	request.Params = params

	handler := func(ctx context.Context, w http.ResponseWriter, r *http.Request, request interface{}) (interface{}, error) {
		return sh.ssi.ListTags(ctx, request.(ListTagsRequestObject))
	}
	for _, middleware := range sh.middlewares {
		handler = middleware(handler, "ListTags")
	}

	response, err := handler(r.Context(), w, r, request)

	if err != nil {
		sh.options.ResponseErrorHandlerFunc(w, r, err)
	} else if validResponse, ok := response.(ListTagsResponseObject); ok {
		if err := validResponse.VisitListTagsResponse(w); err != nil {
			sh.options.ResponseErrorHandlerFunc(w, r, err)
		}
	} else if response != nil {
		sh.options.ResponseErrorHandlerFunc(w, r, fmt.Errorf("unexpected response type: %T", response))
	}
}
