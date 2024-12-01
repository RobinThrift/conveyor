-- name: GetAPIToken :one
SELECT * FROM api_tokens WHERE value = ? AND datetime(expires_at) > datetime("now") LIMIT 1;

-- name: ListAPITokens :many
SELECT *
FROM api_tokens
WHERE id > @page_after
AND account_id = @account_id
ORDER BY id
LIMIT @page_size;

-- name: CreateAPIToken :exec
INSERT INTO api_tokens(
    account_id,
    name,
    value,
    expires_at
) VALUES (?, ?, ?, ?);

-- name: DeleteAPIToken :exec
DELETE FROM api_tokens
WHERE name = ?
AND account_id = ?;
