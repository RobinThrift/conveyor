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

-- name: GetAccountByRef :one
SELECT
    accounts.*
FROM accounts
WHERE auth_ref = ?
LIMIT 1;

-- name: CreateAccount :exec
INSERT INTO accounts(
    username,
    display_name,
    is_admin,
    auth_ref
) VALUES (?, ?, ?, ?);

-- name: UpdateAccount :exec
UPDATE accounts SET
    display_name = ?,
    updated_at = ?
WHERE id = ?;
