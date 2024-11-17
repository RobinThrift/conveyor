-- name: ListAttachments :many
SELECT
    attachments.*
FROM attachments
WHERE created_by = ? AND filename > ?
ORDER BY filename
LIMIT ?;

-- name: CreateAttachment :exec
INSERT INTO attachments(
    filename,
    content_type,
    size_bytes,
    sha256,
    created_by
) VALUES (?, ?, ?, ?, ?);

-- name: CreateMemoAttachmentLink :exec
INSERT INTO memo_attachments(
    memo_id,
    attachment_id
) VALUES (?, ?);

-- name: DeleteMemoAttachmentLinks :exec
DELETE FROM memo_attachments WHERE memo_id = ?;

-- name: DeleteMemoAttachmentLink :exec
DELETE FROM memo_attachments WHERE attachment_id = ?;
