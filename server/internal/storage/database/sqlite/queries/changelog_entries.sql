-- name: ListChangelogEntries :many
SELECT * FROM changelog_entries
WHERE
    account_id = ?
    AND timestamp >= datetime(@since)
ORDER BY timestamp DESC;


-- name: CreateChangelogEntry :exec
INSERT INTO changelog_entries(
    account_id,
    sync_client_id,
    data,
    timestamp
) VALUES (?, ?, ?, ?);
