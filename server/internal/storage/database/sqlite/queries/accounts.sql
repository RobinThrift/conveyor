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


-- name: GetAccountKeyByName :one
SELECT * FROM account_keys
WHERE name = ? AND account_id = ?
LIMIT 1;

-- name: CreateAccountKey :exec
INSERT INTO account_keys(
    account_id,
    name,
    type,
    data
) VALUES (?, ?, ?, ?)
ON CONFLICT (account_id, name, data) DO NOTHING;
