CREATE TABLE memos (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id      TEXT NOT NULL,

    content TEXT NOT NULL,

    is_archived BOOLEAN NOT NULL DEFAULT false,
    is_deleted  BOOLEAN NOT NULL DEFAULT false,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP))
);
CREATE UNIQUE INDEX memos_public_id ON memos(public_id);
CREATE INDEX memos_created_at ON memos(created_at);


CREATE TABLE tags (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    tag            TEXT NOT NULL,
    count          INT NOT NULL DEFAULT 0,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP))
);
CREATE UNIQUE INDEX unique_tag ON tags(tag);


CREATE TABLE memo_tags (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    memo_id        TEXT NOT NULL,
    tag            TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),

    FOREIGN KEY(memo_id) REFERENCES memos(public_id),
    FOREIGN KEY(tag) REFERENCES tags(tag)
);
CREATE UNIQUE INDEX unique_memo_tag_connection ON memo_tags(memo_id, tag);


CREATE TABLE attachments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id    TEXT NOT NULL,

    filepath          TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    content_type      TEXT NOT NULL,
    size_bytes        INT  NOT NULL,
    sha256            BLOB NOT NULL,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP))
);
CREATE UNIQUE INDEX attachment_public_id ON attachments(public_id);


CREATE TABLE memo_attachments (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    memo_id        TEXT NOT NULL,
    attachment_id  TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),

    FOREIGN KEY(memo_id) REFERENCES memos(public_id)
    FOREIGN KEY(attachment_id) REFERENCES attachments(public_id)
);

CREATE TABLE settings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    key        TEXT NOT NULL,
    value      BLOB NOT NULL,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP))
);
CREATE UNIQUE INDEX settings_key_idx ON settings(key);

CREATE TABLE changelog (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id   TEXT NOT NULL,
    source      TEXT NOT NULL,
    revision    INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    target_id   TEXT NOT NULL,
    value       BLOB NOT NULL,

    is_applied  BOOLEAN NOT NULL,
    is_synced   BOOLEAN NOT NULL,

    applied_at  TEXT DEFAULT NULL,
    synced_at   TEXT DEFAULT NULL,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP))
);
CREATE UNIQUE INDEX changelog_public_id_unique_idx ON changelog(public_id);


CREATE VIRTUAL TABLE memos_fts USING fts5(id UNINDEXED, public_id UNINDEXED, content, is_archived UNINDEXED, is_deleted UNINDEXED, created_at UNINDEXED, updated_at UNINDEXED, content='memos', content_rowid='id');

CREATE TRIGGER memos_after_insert AFTER INSERT ON memos BEGIN
    INSERT INTO memos_fts(rowid, id, public_id, content, is_archived, is_deleted, created_at, updated_at) VALUES (
        new.id,
        new.id,
        new.public_id,
        new.content,
        new.is_archived,
        new.is_deleted,
        new.created_at,
        new.updated_at
    );
END;

CREATE TRIGGER memos_after_delete AFTER DELETE ON memos BEGIN
    INSERT INTO memos_fts(memos_fts, rowid, id, public_id, content, is_archived, is_deleted, created_at, updated_at) VALUES (
        'delete',
        old.id,
        old.id,
        old.public_id,
        old.content,
        old.is_archived,
        old.is_deleted,
        old.created_at,
        old.updated_at
    );
END;

CREATE TRIGGER memos_after_update AFTER UPDATE ON memos BEGIN
    INSERT INTO memos_fts(memos_fts, rowid, id, public_id, content, is_archived, is_deleted, created_at, updated_at) VALUES (
        'delete',
        old.id,
        old.id,
        old.public_id,
        old.content,
        old.is_archived,
        old.is_deleted,
        old.created_at,
        old.updated_at
    );

    INSERT INTO memos_fts(rowid, id, public_id, content, is_archived, is_deleted, created_at, updated_at) VALUES (
        new.id,
        new.id,
        new.public_id,
        new.content,
        new.is_archived,
        new.is_deleted,
        new.created_at,
        new.updated_at
    );
END;
