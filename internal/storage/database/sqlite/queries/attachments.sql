-- name: GetAttachment :one
SELECT
    attachments.*
FROM attachments
WHERE id = ?
LIMIT 1;

-- name: GetAttachmentByFilepath :one
SELECT
    attachments.*
FROM attachments
WHERE filepath = ?
LIMIT 1;

-- name: CountAttachments :one
SELECT COUNT(*) FROM attachments;

-- name: ListAttachments :many
SELECT
    attachments.*
FROM attachments
WHERE original_filename > @page_after
ORDER BY original_filename
LIMIT @page_size;

-- name: CreateAttachment :one
INSERT INTO attachments(
    filepath,
    original_filename,
    content_type,
    size_bytes,
    sha256,
    created_by
) VALUES (?, ?, ?, ?, ?, ?)
ON CONFLICT (filepath) DO UPDATE
    SET filepath = filepath
RETURNING id;

-- name: DeleteAttachments :execrows
DELETE FROM attachments WHERE id IN (sqlc.slice('ids'));

-- name: ListAttachmentsForMemo :many
SELECT attachments.*
FROM attachments
JOIN memo_attachments ON memo_attachments.attachment_id = attachments.id
WHERE memo_attachments.memo_id = ?;


-- name: CreateMemoAttachmentLink :exec
INSERT INTO memo_attachments(
    memo_id,
    attachment_id
) VALUES (?, ?);

-- name: DeleteAllMemoAttachmentLinks :exec
DELETE FROM memo_attachments WHERE memo_id = ?;

-- name: DeleteMemoAttachmentLinks :exec
DELETE FROM memo_attachments WHERE memo_id = ? AND attachment_id IN (sqlc.slice('attachment_ids')) ;

-- name: ListUnusedAttachments :many
SELECT attachments.*
FROM attachments
LEFT JOIN memo_attachments ON attachments.id = memo_attachments.attachment_id
WHERE memo_attachments.id IS NULL;
