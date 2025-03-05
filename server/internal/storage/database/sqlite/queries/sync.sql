-- name: GetSyncClient :one
SELECT * FROM sync_clients
WHERE
    public_id = ?
    AND account_id = ?
LIMIT 1;

-- name: CreateSyncClient :exec
INSERT INTO sync_clients(
    public_id,
    account_id
) VALUES (?, ?);

-- name: DeleteSyncClientByPublicID :exec
DELETE FROM sync_clients WHERE public_id = ? AND account_id = ?;


-- name: GetLatestFullSyncEntry :one
SELECT * FROM full_sync_enrires
WHERE account_id = ?
ORDER BY timestamp DESC
LIMIT 1;

-- name: CreateFullSyncEntry :exec
INSERT INTO full_sync_enrires (
    account_id,
    timestamp,
    size_bytes,
    sha256
) VALUES (?, ?, ?, ?);
