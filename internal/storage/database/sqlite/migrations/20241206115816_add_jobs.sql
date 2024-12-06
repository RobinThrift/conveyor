-- +goose Up
CREATE TABLE jobs (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    state          TEXT NOT NULL DEFAULT "scheduled",
    kind           TEXT NOT NULL,
    data           BLOB NOT NULL,
    result         BLOB DEFAULT NULL,
    scheduled_for  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),
    created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)),
    finished_at    TEXT DEFAULT NULL,

    created_by INTEGER NOT NULL,
    FOREIGN KEY(created_by) REFERENCES accounts(id)
);
CREATE INDEX jobs_scheduled_for ON jobs(scheduled_for DESC);


-- +goose Down
DROP INDEX jobs_scheduled_for;
DROP TABLE jobs;
