-- +goose Up
CREATE TABLE accounts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,

    username        TEXT    NOT NULL,

    algorithm                TEXT    NOT NULL,
    params                   TEXT    NOT NULL,
    salt                     BLOB    NOT NULL,
    password                 BLOB    NOT NULL,
    requires_password_change BOOLEAN NOT NULL DEFAULT true,

    created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),
    updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP))
);
CREATE UNIQUE INDEX unique_accounts_username ON accounts(username);

CREATE TABLE account_keys (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id      INTEGER NOT NULL,

    name            TEXT    NOT NULL,
    type            TEXT    NOT NULL,
    data            BLOB    NOT NULL,

    created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),
    updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),

    FOREIGN KEY(account_id) REFERENCES accounts(id)
);
CREATE UNIQUE INDEX unique_account_keys ON account_keys(account_id, name, data);


CREATE TABLE auth_tokens (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id         INTEGER NOT NULL,

    value              BLOB NOT NULL,
    expires_at         TEXT NOT NULL,

    refresh_value      BLOB NOT NULL,
    refresh_expires_at TEXT NOT NULL,

	is_valid           BOOLEAN NOT NULL,

    created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),

    FOREIGN KEY(account_id) REFERENCES accounts(id)
);
CREATE UNIQUE INDEX unique_auth_token ON auth_tokens(value);


CREATE TABLE sync_clients (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id       TEXT NOT NULL,

    account_id      INTEGER NOT NULL,

    created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),
    updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),

    FOREIGN KEY(account_id) REFERENCES accounts(id)
);
CREATE UNIQUE INDEX unique_client_public_id ON sync_clients(public_id);

CREATE TABLE full_sync_enrires (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id     INTEGER NOT NULL,
    timestamp      TEXT    NOT NULL,
    size_bytes     INT     NOT NULL,
    sha256         BLOB    NOT NULL,

    FOREIGN KEY(account_id) REFERENCES accounts(id)
);


CREATE TABLE changelog_entries (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id      INTEGER NOT NULL,
    sync_client_id  TEXT NOT NULL,

    data            BLOB NOT NULL,

    timestamp       TEXT NOT NULL,

    FOREIGN KEY(account_id) REFERENCES accounts(id)
);


CREATE TABLE jobs (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    state          TEXT NOT NULL DEFAULT "scheduled",
    kind           TEXT NOT NULL,
    data           BLOB NOT NULL,
    result         BLOB DEFAULT NULL,
    scheduled_for  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),
    created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),
    finished_at    TEXT DEFAULT NULL
);
CREATE INDEX jobs_scheduled_for ON jobs(scheduled_for DESC);

-- +goose Down
DROP INDEX jobs_scheduled_for;
DROP TABLE jobs;

DROP TABLE changelog_entries;

DROP TABLE full_sync_enrires;

DROP INDEX unique_client_public_id;
DROP TABLE sync_clients;

DROP INDEX unique_auth_token;
DROP TABLE auth_tokens;

DROP INDEX unique_accounts_username;
DROP TABLE accounts;
