-- name: GetMemo :one
SELECT *
FROM memos
WHERE id = ?
LIMIT 1;

-- name: ListMemos :many
SELECT *
FROM memos
WHERE
    is_archived = false
    AND is_deleted = false
    AND id > CAST(@after as INTEGER)
    AND CASE WHEN CAST(@with_created_at as BOOLEAN) THEN date(created_at) = date(@created_at) ELSE true END
    AND CASE WHEN CAST(@with_created_at_or_older as BOOLEAN) THEN date(created_at) <= date(@created_at_or_older) ELSE true END
ORDER BY created_at DESC
LIMIT @limit;

-- name: ListMemosForTags :many
SELECT * FROM memos
JOIN memo_tags ON memo_id = memos.id
WHERE
    is_archived = false
    AND is_deleted = false
    AND id > CAST(@after as INTEGER)
    AND memo_tags.tag = @tag
    AND CASE WHEN CAST(@with_created_at as BOOLEAN) THEN date(created_at) = date(@created_at) ELSE true END
    AND CASE WHEN CAST(@with_created_at_or_older as BOOLEAN) THEN date(created_at) <= date(@created_at_or_older) ELSE true END
ORDER BY created_at DESC
LIMIT @limit;

-- name: ListMemosWithSearch :many
SELECT *
FROM memos_fts
WHERE
    is_archived = false
    AND is_deleted = false
    AND id > CAST(@after as INTEGER)
    AND content MATCH CAST(@search as TEXT)
    AND CASE WHEN CAST(@with_created_at as BOOLEAN) THEN date(created_at) = date(@created_at) ELSE true END
    AND CASE WHEN CAST(@with_created_at_or_older as BOOLEAN) THEN date(created_at) <= date(@created_at_or_older) ELSE true END
ORDER BY created_at DESC, rank
LIMIT @limit;

-- name: ListMemosForTagsWithSearch :many
SELECT * FROM memos_fts
JOIN memo_tags ON memo_id = memos.id
WHERE
    is_archived = false
    AND is_deleted = false
    AND id > CAST(@after as INTEGER)
    AND memo_tags.tag = @tag
    AND content MATCH CAST(@search as TEXT)
    AND CASE WHEN CAST(@with_created_at as BOOLEAN) THEN date(created_at) = date(@created_at) ELSE true END
    AND CASE WHEN CAST(@with_created_at_or_older as BOOLEAN) THEN date(created_at) <= date(@created_at_or_older) ELSE true END
ORDER BY created_at DESC, rank
LIMIT @limit;

-- name: ListArchivedMemos :many
SELECT *
FROM memos
WHERE
    is_archived = true
    AND is_deleted = false
    AND id > ?
ORDER BY created_at DESC
LIMIT ?;

-- name: ListDeletedMemos :many
SELECT *
FROM memos
WHERE
    is_deleted = true
    AND id > ?
ORDER BY created_at DESC
LIMIT ?;

-- name: CreateMemo :exec
INSERT INTO memos(
    name,
    content,
    created_by,
    created_at
) VALUES (?, ?, ?, ?);

-- name: UpdateMemoContent :execrows
UPDATE memos SET
    content = ?,
    updated_at = strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)
WHERE id = ?;

-- name: ArchiveMemo :execrows
UPDATE memos SET
    is_archived = true,
    updated_at = strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)
WHERE id = ?;

-- name: SoftDeleteMemo :exec
UPDATE memos SET
    is_deleted = true,
    updated_at = strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)
WHERE id = ?;

-- name: CleanupDeletedMemos :execrows
DELETE FROM memos WHERE is_deleted = true AND date(updated_at) < date('now','-30 days');
