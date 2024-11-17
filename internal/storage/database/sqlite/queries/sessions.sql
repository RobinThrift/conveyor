-- name: GetSession :one
SELECT
    sessions.*
FROM sessions
WHERE token = ?
LIMIT 1;

-- name: CreateSession :exec
INSERT INTO sessions(
    token,
    data,
    expires_at
) VALUES (?, ?, ?)
ON CONFLICT (token)
DO UPDATE SET
    data       = excluded.data,
    expires_at = excluded.expires_at;

-- name: DeleteSession :exec
DELETE FROM sessions WHERE token = ?;

-- name: DeleteExpired :exec
DELETE FROM sessions WHERE datetime(expires_at) > CURRENT_TIMESTAMP;
