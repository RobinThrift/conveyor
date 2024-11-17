new-migration name: (_install-tool "goose")
    {{ local_bin }}/goose -table migrations -dir internal/storage/database/sqlite/migrations sqlite3 create {{name}} sql

_gen-sqlc: (_install-tool "sqlc")
    {{ local_bin }}/sqlc generate -f internal/storage/database/sqlite/sqlc.yaml

