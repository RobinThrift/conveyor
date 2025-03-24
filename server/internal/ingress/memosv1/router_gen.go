//lint:file-ignore ST1005 Ignore because generated code
//lint:file-ignore SA1029 Ignore because generated code
//go:build go1.22

// Package memosv1 provides primitives to interact with the openapi HTTP API.
//
// Code generated by github.com/oapi-codegen/oapi-codegen/v2 version v2.4.1 DO NOT EDIT.
package memosv1

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/oapi-codegen/runtime"
	strictnethttp "github.com/oapi-codegen/runtime/strictmiddleware/nethttp"
	"go.robinthrift.com/belt/internal/x/httperrors"
)

const (
	TokenBearerAuthScopes = "tokenBearerAuth.Scopes"
)

// Error Follows RFC7807 (https://datatracker.ietf.org/doc/html/rfc7807)
type Error = httperrors.Error

// PlaintextMemo Plaintext memo content.
type PlaintextMemo struct {
	Content   string     `json:"content"`
	CreatedAt *time.Time `json:"createdAt,omitempty"`
}

// ErrorBadRequest Follows RFC7807 (https://datatracker.ietf.org/doc/html/rfc7807)
type ErrorBadRequest = Error

// ErrorNotFound Follows RFC7807 (https://datatracker.ietf.org/doc/html/rfc7807)
type ErrorNotFound = Error

// ErrorOther Follows RFC7807 (https://datatracker.ietf.org/doc/html/rfc7807)
type ErrorOther = Error

// ErrorUnauthorized Follows RFC7807 (https://datatracker.ietf.org/doc/html/rfc7807)
type ErrorUnauthorized = Error

// UploadAttachmentResponse Attachment metadata.
type UploadAttachmentResponse struct {
	Id string `json:"id"`
}

// CreateMemoRequest defines model for CreateMemoRequest.
type CreateMemoRequest struct {
	Content      string     `json:"content"`
	CreatedAt    *time.Time `json:"createdAt,omitempty"`
	Data         []byte     `json:"data"`
	SyncClientID string     `json:"syncClientID"`
	Timestamp    time.Time  `json:"timestamp"`
}

// UploadAttachmentParams defines parameters for UploadAttachment.
type UploadAttachmentParams struct {
	// ContentEncoding Encoding of the uploaded data.
	ContentEncoding *string `json:"Content-Encoding,omitempty"`

	// ContentType Content-Type of the uploaded data.
	ContentType *string `json:"Content-Type,omitempty"`

	// XFilename Filename of the attachment.
	XFilename string `json:"X-Filename"`

	// XFilepath Full filepath for the file, required when using X-Encrypted.
	XFilepath *string `json:"X-Filepath,omitempty"`

	// XEncrypted Indicate that the content is already encrypted.
	XEncrypted *bool `json:"X-Encrypted,omitempty"`
}

// CreateMemoJSONBody defines parameters for CreateMemo.
type CreateMemoJSONBody struct {
	Content      string     `json:"content"`
	CreatedAt    *time.Time `json:"createdAt,omitempty"`
	Data         []byte     `json:"data"`
	SyncClientID string     `json:"syncClientID"`
	Timestamp    time.Time  `json:"timestamp"`
}

// CreateMemoJSONRequestBody defines body for CreateMemo for application/json ContentType.
type CreateMemoJSONRequestBody CreateMemoJSONBody

// ServerInterface represents all server handlers.
type ServerInterface interface {
	// Upload an attachment
	// (POST /attachments)
	UploadAttachment(w http.ResponseWriter, r *http.Request, params UploadAttachmentParams)
	// Create a new memo.
	// (POST /memos)
	CreateMemo(w http.ResponseWriter, r *http.Request)
}

// ServerInterfaceWrapper converts contexts to parameters.
type ServerInterfaceWrapper struct {
	Handler            ServerInterface
	HandlerMiddlewares []MiddlewareFunc
	ErrorHandlerFunc   func(w http.ResponseWriter, r *http.Request, err error)
}

type MiddlewareFunc func(http.Handler) http.Handler

// UploadAttachment operation middleware
func (siw *ServerInterfaceWrapper) UploadAttachment(w http.ResponseWriter, r *http.Request) {

	var err error

	ctx := r.Context()

	ctx = context.WithValue(ctx, TokenBearerAuthScopes, []string{})

	r = r.WithContext(ctx)

	// Parameter object where we will unmarshal all parameters from the context
	var params UploadAttachmentParams

	headers := r.Header

	// ------------- Optional header parameter "Content-Encoding" -------------
	if valueList, found := headers[http.CanonicalHeaderKey("Content-Encoding")]; found {
		var ContentEncoding string
		n := len(valueList)
		if n != 1 {
			siw.ErrorHandlerFunc(w, r, &TooManyValuesForParamError{ParamName: "Content-Encoding", Count: n})
			return
		}

		err = runtime.BindStyledParameterWithOptions("simple", "Content-Encoding", valueList[0], &ContentEncoding, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationHeader, Explode: false, Required: false})
		if err != nil {
			siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "Content-Encoding", Err: err})
			return
		}

		params.ContentEncoding = &ContentEncoding

	}

	// ------------- Optional header parameter "Content-Type" -------------
	if valueList, found := headers[http.CanonicalHeaderKey("Content-Type")]; found {
		var ContentType string
		n := len(valueList)
		if n != 1 {
			siw.ErrorHandlerFunc(w, r, &TooManyValuesForParamError{ParamName: "Content-Type", Count: n})
			return
		}

		err = runtime.BindStyledParameterWithOptions("simple", "Content-Type", valueList[0], &ContentType, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationHeader, Explode: false, Required: false})
		if err != nil {
			siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "Content-Type", Err: err})
			return
		}

		params.ContentType = &ContentType

	}

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

	// ------------- Optional header parameter "X-Filepath" -------------
	if valueList, found := headers[http.CanonicalHeaderKey("X-Filepath")]; found {
		var XFilepath string
		n := len(valueList)
		if n != 1 {
			siw.ErrorHandlerFunc(w, r, &TooManyValuesForParamError{ParamName: "X-Filepath", Count: n})
			return
		}

		err = runtime.BindStyledParameterWithOptions("simple", "X-Filepath", valueList[0], &XFilepath, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationHeader, Explode: false, Required: false})
		if err != nil {
			siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "X-Filepath", Err: err})
			return
		}

		params.XFilepath = &XFilepath

	}

	// ------------- Optional header parameter "X-Encrypted" -------------
	if valueList, found := headers[http.CanonicalHeaderKey("X-Encrypted")]; found {
		var XEncrypted bool
		n := len(valueList)
		if n != 1 {
			siw.ErrorHandlerFunc(w, r, &TooManyValuesForParamError{ParamName: "X-Encrypted", Count: n})
			return
		}

		err = runtime.BindStyledParameterWithOptions("simple", "X-Encrypted", valueList[0], &XEncrypted, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationHeader, Explode: false, Required: false})
		if err != nil {
			siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "X-Encrypted", Err: err})
			return
		}

		params.XEncrypted = &XEncrypted

	}

	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.UploadAttachment(w, r, params)
	}))

	for _, middleware := range siw.HandlerMiddlewares {
		handler = middleware(handler)
	}

	handler.ServeHTTP(w, r)
}

// CreateMemo operation middleware
func (siw *ServerInterfaceWrapper) CreateMemo(w http.ResponseWriter, r *http.Request) {

	ctx := r.Context()

	ctx = context.WithValue(ctx, TokenBearerAuthScopes, []string{})

	r = r.WithContext(ctx)

	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.CreateMemo(w, r)
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

	m.HandleFunc("POST "+options.BaseURL+"/attachments", wrapper.UploadAttachment)
	m.HandleFunc("POST "+options.BaseURL+"/memos", wrapper.CreateMemo)

	return m
}

type ErrorBadRequestJSONResponse Error

type ErrorNotFoundJSONResponse Error

type ErrorOtherJSONResponse Error

type ErrorUnauthorizedJSONResponse Error

type UploadAttachmentResponseJSONResponse struct {
	Id string `json:"id"`
}

type UploadAttachmentRequestObject struct {
	Params UploadAttachmentParams
	Body   io.Reader
}

type UploadAttachmentResponseObject interface {
	VisitUploadAttachmentResponse(w http.ResponseWriter) error
}

type UploadAttachment201JSONResponse struct {
	UploadAttachmentResponseJSONResponse
}

func (response UploadAttachment201JSONResponse) VisitUploadAttachmentResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(201)

	return json.NewEncoder(w).Encode(response)
}

type UploadAttachment400JSONResponse struct{ ErrorBadRequestJSONResponse }

func (response UploadAttachment400JSONResponse) VisitUploadAttachmentResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(400)

	return json.NewEncoder(w).Encode(response)
}

type UploadAttachment401JSONResponse struct{ ErrorUnauthorizedJSONResponse }

func (response UploadAttachment401JSONResponse) VisitUploadAttachmentResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(401)

	return json.NewEncoder(w).Encode(response)
}

type UploadAttachment404JSONResponse struct{ ErrorNotFoundJSONResponse }

func (response UploadAttachment404JSONResponse) VisitUploadAttachmentResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(404)

	return json.NewEncoder(w).Encode(response)
}

type UploadAttachmentdefaultJSONResponse struct {
	Body       Error
	StatusCode int
}

func (response UploadAttachmentdefaultJSONResponse) VisitUploadAttachmentResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(response.StatusCode)

	return json.NewEncoder(w).Encode(response.Body)
}

type CreateMemoRequestObject struct {
	Body *CreateMemoJSONRequestBody
}

type CreateMemoResponseObject interface {
	VisitCreateMemoResponse(w http.ResponseWriter) error
}

type CreateMemo201Response struct {
}

func (response CreateMemo201Response) VisitCreateMemoResponse(w http.ResponseWriter) error {
	w.WriteHeader(201)
	return nil
}

type CreateMemo400JSONResponse struct{ ErrorBadRequestJSONResponse }

func (response CreateMemo400JSONResponse) VisitCreateMemoResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(400)

	return json.NewEncoder(w).Encode(response)
}

type CreateMemo401JSONResponse struct{ ErrorUnauthorizedJSONResponse }

func (response CreateMemo401JSONResponse) VisitCreateMemoResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(401)

	return json.NewEncoder(w).Encode(response)
}

type CreateMemo404JSONResponse struct{ ErrorNotFoundJSONResponse }

func (response CreateMemo404JSONResponse) VisitCreateMemoResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(404)

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

// StrictServerInterface represents all server handlers.
type StrictServerInterface interface {
	// Upload an attachment
	// (POST /attachments)
	UploadAttachment(ctx context.Context, request UploadAttachmentRequestObject) (UploadAttachmentResponseObject, error)
	// Create a new memo.
	// (POST /memos)
	CreateMemo(ctx context.Context, request CreateMemoRequestObject) (CreateMemoResponseObject, error)
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

// UploadAttachment operation middleware
func (sh *strictHandler) UploadAttachment(w http.ResponseWriter, r *http.Request, params UploadAttachmentParams) {
	var request UploadAttachmentRequestObject

	request.Params = params

	request.Body = r.Body

	handler := func(ctx context.Context, w http.ResponseWriter, r *http.Request, request interface{}) (interface{}, error) {
		return sh.ssi.UploadAttachment(ctx, request.(UploadAttachmentRequestObject))
	}
	for _, middleware := range sh.middlewares {
		handler = middleware(handler, "UploadAttachment")
	}

	response, err := handler(r.Context(), w, r, request)

	if err != nil {
		sh.options.ResponseErrorHandlerFunc(w, r, err)
	} else if validResponse, ok := response.(UploadAttachmentResponseObject); ok {
		if err := validResponse.VisitUploadAttachmentResponse(w); err != nil {
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
