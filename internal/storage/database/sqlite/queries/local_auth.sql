-- name: GetLocalAuthAccountByUsername :one
SELECT
    local_auth_accounts.*
FROM local_auth_accounts
WHERE username = ?
LIMIT 1;

-- name: CreateLocalAuthAccount :exec
INSERT INTO local_auth_accounts(
    username,
    algorithm,
    params,
    salt,
    password,
    requires_password_change
) VALUES (?, ?, ?, ?, ?, ?);

-- name: UpdateALocalAuthccount :exec
UPDATE local_auth_accounts SET
    algorithm = ?,
    params = ?,
    salt = ?,
    password = ?,
    requires_password_change = ?,
    updated_at = ?
WHERE id = ?;

