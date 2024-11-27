-- name: GetMemo :one
SELECT *
FROM memos
WHERE id = ?
LIMIT 1;

-- name: ListMemos :many
SELECT *
FROM memos
WHERE
    CASE WHEN @page_after IS NOT NULL THEN created_at < datetime(@page_after) ELSE true END
    AND CASE WHEN CAST(@with_created_at AS BOOLEAN) THEN date(created_at) = date(@created_at) ELSE true END
    AND CASE WHEN CAST(@with_created_at_or_older AS BOOLEAN) THEN date(created_at) <= date(@created_at_or_older) ELSE true END
    AND CASE WHEN CAST(@with_is_archived AS BOOLEAN) THEN is_archived = CAST(@is_archived AS BOOLEAN) ELSE is_archived = false END
    AND CASE WHEN CAST(@with_is_deleted AS BOOLEAN) THEN is_deleted = CAST(@is_deleted AS BOOLEAN) ELSE is_deleted = false END
ORDER BY created_at DESC
LIMIT @page_size;

-- name: ListMemosForTags :many
SELECT * FROM memos
JOIN memo_tags ON memo_id = memos.id
WHERE
    CASE WHEN @page_after IS NOT NULL THEN memos.created_at < datetime(@page_after) ELSE true END
    AND memo_tags.tag = @tag
    AND CASE WHEN CAST(@with_created_at AS BOOLEAN) THEN date(memos.created_at) = date(@created_at) ELSE true END
    AND CASE WHEN CAST(@with_created_at_or_older AS BOOLEAN) THEN date(memos.created_at) <= date(@created_at_or_older) ELSE true END
    AND CASE WHEN CAST(@with_is_archived AS BOOLEAN) THEN is_archived = CAST(@is_archived AS BOOLEAN) ELSE is_archived = false END
    AND CASE WHEN CAST(@with_is_deleted AS BOOLEAN) THEN is_deleted = CAST(@is_deleted AS BOOLEAN) ELSE is_deleted = false END
ORDER BY memos.created_at DESC
LIMIT @page_size;

-- name: ListMemosWithSearch :many
SELECT *
FROM memos_fts
WHERE
    CASE WHEN @page_after IS NOT NULL THEN created_at < datetime(@page_after) ELSE true END
    AND content MATCH CAST(@search as TEXT)
    AND CASE WHEN CAST(@with_created_at as BOOLEAN) THEN date(created_at) = date(@created_at) ELSE true END
    AND CASE WHEN CAST(@with_created_at_or_older as BOOLEAN) THEN date(created_at) <= date(@created_at_or_older) ELSE true END
    AND CASE WHEN CAST(@with_is_archived AS BOOLEAN) THEN is_archived = CAST(@is_archived AS BOOLEAN) ELSE is_archived = false END
    AND CASE WHEN CAST(@with_is_deleted AS BOOLEAN) THEN is_deleted = CAST(@is_deleted AS BOOLEAN) ELSE is_deleted = false END
ORDER BY created_at DESC, rank
LIMIT @page_size;

-- name: ListMemosForTagsWithSearch :many
SELECT * FROM memos_fts
JOIN memo_tags ON memo_id = memos_fts.id
WHERE
    CASE WHEN @page_after IS NOT NULL THEN memos_fts.created_at < datetime(@page_after) ELSE true END
    AND memo_tags.tag = @tag
    AND content MATCH CAST(@search as TEXT)
    AND CASE WHEN CAST(@with_created_at as BOOLEAN) THEN date(memos_fts.created_at) = date(@created_at) ELSE true END
    AND CASE WHEN CAST(@with_created_at_or_older as BOOLEAN) THEN date(memos_fts.created_at) <= date(@created_at_or_older) ELSE true END
    AND CASE WHEN CAST(@with_is_archived AS BOOLEAN) THEN is_archived = CAST(@is_archived AS BOOLEAN) ELSE is_archived = false END
    AND CASE WHEN CAST(@with_is_deleted AS BOOLEAN) THEN is_deleted = CAST(@is_deleted AS BOOLEAN) ELSE is_deleted = false END
ORDER BY memos_fts.created_at DESC, rank
LIMIT @page_size;

-- name: CreateMemo :one
INSERT INTO memos(
    content,
    created_by,
    created_at
) VALUES (?, ?, ?)
RETURNING id;

-- name: UpdateMemoContent :execrows
UPDATE memos SET
    content = ?,
    updated_at = strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)
WHERE id = ?;

-- name: SeteMemoArchiveStatus :execrows
UPDATE memos SET
    is_archived = ?,
    is_deleted = false,
    updated_at = strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)
WHERE id = ?;

-- name: SetMemoDeletionStatus :execrows
UPDATE memos SET
    is_deleted = ?,
    is_archived = false,
    updated_at = strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)
WHERE id = ?;

-- name: CleanupDeletedMemos :execrows
DELETE FROM memos WHERE is_deleted = true AND date(updated_at) < date('now','-30 days');
