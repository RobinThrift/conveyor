-- +goose Up
CREATE TABLE sessions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    token      TEXT NOT NULL,
    data       BLOB NOT NULL,
    expires_at TEXT NOT NULL
);
CREATE UNIQUE INDEX unique_session_token ON sessions(token);


CREATE TABLE local_auth_accounts (
    id                       INTEGER PRIMARY KEY AUTOINCREMENT,
    username                 TEXT    NOT NULL,
    algorithm                TEXT    NOT NULL,
    params                   TEXT    NOT NULL,
    salt                     BLOB    NOT NULL,
    password                 BLOB    NOT NULL,
    requires_password_change BOOLEAN NOT NULL DEFAULT true,
    created_at               TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),
    updated_at               TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP))
);
CREATE UNIQUE INDEX unique_usernames_auth_method_local ON local_auth_accounts(username);

CREATE TABLE accounts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,

    username        TEXT NOT NULL,
    display_name    TEXT NOT NULL,

    is_admin        BOOLEAN NOT NULL DEFAULT false,

    auth_ref        TEXT NOT NULL,

    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP))
);
CREATE UNIQUE INDEX unique_usernames ON accounts(username);
CREATE UNIQUE INDEX unique_auth_ref ON accounts(auth_ref);


CREATE TABLE memos (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,

    content TEXT NOT NULL,

    is_archived BOOLEAN NOT NULL DEFAULT false,
    is_deleted  BOOLEAN NOT NULL DEFAULT false,

    created_by INTEGER NOT NULL,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),

    FOREIGN KEY(created_by) REFERENCES accounts(id)
);
CREATE INDEX memos_created_at ON memos(created_at);


CREATE TABLE tags (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    tag            TEXT NOT NULL,
    count          INT NOT NULL DEFAULT 0,

    created_by INTEGER NOT NULL,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),

    FOREIGN KEY(created_by) REFERENCES accounts(id)
);
CREATE UNIQUE INDEX unique_tag ON tags(tag);

CREATE TABLE memo_tags (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    memo_id        INT NOT NULL,
    tag            TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),

    FOREIGN KEY(memo_id) REFERENCES memos(id),
    FOREIGN KEY(tag) REFERENCES tags(tag)
);
CREATE UNIQUE INDEX unique_memo_tag_connection ON memo_tags(memo_id, tag);


CREATE TABLE attachments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,

    filepath          TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    content_type      TEXT NOT NULL,
    size_bytes        INT  NOT NULL,
    sha256            BLOB NOT NULL,

    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),

    FOREIGN KEY(created_by) REFERENCES accounts(id)
);
CREATE UNIQUE INDEX attachment_filepath ON attachments(filepath);

CREATE TABLE memo_attachments (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    memo_id        INTEGER NOT NULL,
    attachment_id  INTEGER NOT NULL,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),

    FOREIGN KEY(memo_id) REFERENCES memos(id)
    FOREIGN KEY(attachment_id) REFERENCES attachments(id)
);


CREATE VIRTUAL TABLE memos_fts USING fts5(id UNINDEXED, content, is_archived UNINDEXED, is_deleted UNINDEXED, created_by UNINDEXED, created_at UNINDEXED, updated_at UNINDEXED, content='memos', content_rowid='id');

-- +goose StatementBegin
CREATE TRIGGER memos_after_insert AFTER INSERT ON memos BEGIN
    INSERT INTO memos_fts(rowid, id, content, is_archived, is_deleted, created_by, created_at, updated_at) VALUES (
        new.id,
        new.id,
        new.content,
        new.is_archived,
        new.is_deleted,
        new.created_by,
        new.created_at,
        new.updated_at
    );
END;
-- +goose StatementEnd

-- +goose StatementBegin
CREATE TRIGGER memos_after_delete AFTER DELETE ON memos BEGIN
    INSERT INTO memos_fts(memos_fts, rowid, id, content, is_archived, is_deleted, created_by, created_at, updated_at) VALUES (
        'delete',
        old.id,
        old.id,
        old.content,
        old.is_archived,
        old.is_deleted,
        old.created_by,
        old.created_at,
        old.updated_at
    );
END;
-- +goose StatementEnd

-- +goose StatementBegin
CREATE TRIGGER memos_after_update AFTER UPDATE ON memos BEGIN
    INSERT INTO memos_fts(memos_fts, rowid, id, content, is_archived, is_deleted, created_by, created_at, updated_at) VALUES (
        'delete',
        old.id,
        old.id,
        old.content,
        old.is_archived,
        old.is_deleted,
        old.created_by,
        old.created_at,
        old.updated_at
    );

    INSERT INTO memos_fts(rowid, id, content, is_archived, is_deleted, created_by, created_at, updated_at) VALUES (
        new.id,
        new.id,
        new.content,
        new.is_archived,
        new.is_deleted,
        new.created_by,
        new.created_at,
        new.updated_at
    );
END;
-- +goose StatementEnd

-- +goose Down
DROP TRIGGER memos_after_update;
DROP TRIGGER memos_after_delete;
DROP TRIGGER memos_after_insert;
DROP TABLE memos_fts;

DROP TABLE memo_attachments;
DROP INDEX attachment_filepath;
DROP TABLE attachments;

DROP INDEX unique_memo_tag_connection;
DROP TABLE memo_tags;
DROP INDEX unique_tag;
DROP TABLE tags;

DROP INDEX memos_created_at;
DROP TABLE memos;

DROP INDEX unique_usernames;
DROP INDEX unique_auth_ref;
DROP TABLE accounts;

DROP INDEX unique_usernames_auth_method_local;
DROP TABLE local_auth_accounts;

DROP INDEX unique_session_token;
DROP TABLE sessions;
