-- +goose Up
CREATE TABLE api_tokens (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id      INTEGER NOT NULL,
    token_id        INTEGER NOT NULL,

    name            TEXT NOT NULL,

    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),
    expires_at      TEXT NOT NULL,

    FOREIGN KEY(account_id) REFERENCES accounts(id),
    FOREIGN KEY(token_id) REFERENCES auth_tokens(id)
);
CREATE UNIQUE INDEX unique_api_token_name ON api_tokens(account_id, name);


-- +goose Down

DROP INDEX unique_api_token_name;
DROP TABLE api_tokens;
