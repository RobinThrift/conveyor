_gen-api-v1-server: (_install-tool "oapi-codegen")
    {{ local_bin }}/oapi-codegen -generate types,std-http-server,strict-server -o ./internal/ingress/apiv1/router_gen.go -package apiv1 ./api/apiv1/apiv1.openapi3.yaml
    sed -i '' -e '1s;^;//lint:file-ignore ST1005 Ignore because generated code\n//lint:file-ignore SA1029 Ignore because generated code\n;' ./internal/ingress/apiv1/router_gen.go
    go fmt ./...
