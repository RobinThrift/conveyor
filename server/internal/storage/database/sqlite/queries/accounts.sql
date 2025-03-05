-- name: CountAccounts :one
SELECT COUNT(*) as count FROM accounts;

-- name: GetAccount :one
SELECT
    accounts.*
FROM accounts
WHERE id = ?
LIMIT 1;

-- name: GetAccountByUsername :one
SELECT
    accounts.*
FROM accounts
WHERE username = ?
LIMIT 1;

-- name: CreateAccount :exec
INSERT INTO accounts(
    username,
    algorithm,
    params,
    salt,
    password
) VALUES (?, ?, ?, ?, ?);

-- name: UpdateAccount :exec
UPDATE accounts SET
    algorithm = ?,
    params = ?,
    salt = ?,
    password = ?,
	requires_password_change = ?,
    updated_at = ?
WHERE id = ?;

