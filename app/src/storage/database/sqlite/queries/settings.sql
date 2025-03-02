-- name: ListSettings :many
SELECT * FROM settings;

-- name: SaveSetting :exec
INSERT INTO settings(
    key,
    value
) VALUES (?, ?)
ON CONFLICT (key)
DO UPDATE SET
    value = excluded.value,
    updated_at  = strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP);

