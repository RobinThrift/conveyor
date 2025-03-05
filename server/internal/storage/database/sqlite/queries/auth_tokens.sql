-- name: GetAuthToken :one
SELECT * FROM auth_tokens WHERE value = ? AND datetime(expires_at) > datetime("now") AND is_valid = TRUE LIMIT 1;

-- name: GetAuthTokenByRefreshValue :one
SELECT * FROM auth_tokens WHERE refresh_value = ? AND datetime(refresh_expires_at) > datetime("now") AND is_valid = TRUE LIMIT 1;

-- name: CreateAuthToken :exec
INSERT INTO auth_tokens(
    account_id,
    value,
    expires_at,
    refresh_value,
    refresh_expires_at,
    is_valid
) VALUES (?, ?, ?, ?, ?, TRUE);

-- name: InvalidateAuthToken :exec
UPDATE auth_tokens
SET is_valid = false
WHERE value = ?;

-- name: MarkExpiredAuthTokensAsInvalid :exec
UPDATE auth_tokens
SET is_valid = false
WHERE datetime(refresh_expires_at) > datetime("now");

-- name: DeleteInvalidTokens :exec
DELETE FROM auth_tokens WHERE is_valid = FALSE;
