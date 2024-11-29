-- name: GetSettings :one
SELECT * FROM settings
WHERE account_id = ?
LIMIT 1;

-- name: UpsertSetting :exec
INSERT INTO settings(
    account_id,
    key,
    value
) VALUES (?, ?, ?)
ON CONFLICT (account_id, key)
DO UPDATE SET
    value = excluded.value,
    updated_at  = strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP);
