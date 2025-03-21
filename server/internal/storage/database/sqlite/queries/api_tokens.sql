-- name: GetAPIToken :one
SELECT * FROM api_tokens WHERE name = ? AND account_id = ? LIMIT 1;

-- name: ListAPITokens :many
SELECT *
FROM api_tokens
WHERE id >= @page_after
AND account_id = @account_id
ORDER BY id DESC
LIMIT @page_size;

-- name: CreateAPIToken :exec
INSERT INTO api_tokens(
    account_id,
    token_id,
	name,
    expires_at
) VALUES (?, ?, ?, ?);

-- name: DeleteAPIToken :exec
DELETE FROM api_tokens WHERE name = ? AND account_id = ?;

