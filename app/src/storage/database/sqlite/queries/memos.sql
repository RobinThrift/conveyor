-- name: GetMemo :one
SELECT public_id, content, is_archived, is_deleted, created_at, updated_at
FROM memos
WHERE public_id = ?
LIMIT 1;

-- name: ListMemos :many
SELECT public_id, content, is_archived, is_deleted, created_at, updated_at
FROM memos
WHERE
    CASE WHEN @page_after IS NOT NULL THEN created_at < datetime(@page_after) ELSE true END
    AND CASE WHEN CAST(@with_created_at AS BOOLEAN) THEN date(created_at) = date(@created_at) ELSE true END
    AND CASE WHEN CAST(@with_created_at_or_older AS BOOLEAN) THEN date(created_at) <= date(@created_at_or_older) ELSE true END
    AND CASE WHEN CAST(@with_is_archived AS BOOLEAN) THEN is_archived = CAST(@is_archived AS BOOLEAN) ELSE is_archived = false END
    AND CASE WHEN CAST(@with_is_deleted AS BOOLEAN) THEN is_deleted = CAST(@is_deleted AS BOOLEAN) ELSE is_deleted = false END
ORDER BY created_at DESC
LIMIT @page_size;

-- name: ListMemosForTag :many
SELECT memos.public_id, memos.content, memos.is_archived, memos.is_deleted, memos.created_at, memos.updated_at FROM memos
JOIN memo_tags ON memo_id = memos.public_id
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
SELECT public_id, content, is_archived, is_deleted, created_at, updated_at
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

-- name: ListMemosForTagWithSearch :many
SELECT memos_fts.public_id, memos_fts.content, memos_fts.is_archived, memos_fts.is_deleted, memos_fts.created_at, memos_fts.updated_at FROM memos_fts
JOIN memo_tags ON memo_id = memos_fts.public_id
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
    public_id,
    content,
    created_at
) VALUES (?, ?, ?)
RETURNING public_id;

-- name: UpdateMemoContent :execrows
UPDATE memos SET
    content = ?,
    updated_at = strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)
WHERE public_id = ?;

-- name: SeteMemoArchiveStatus :execrows
UPDATE memos SET
    is_archived = ?,
    is_deleted = false,
    updated_at = strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)
WHERE public_id = ?;

-- name: SetMemoDeletionStatus :execrows
UPDATE memos SET
    is_deleted = ?,
    is_archived = false,
    updated_at = strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)
WHERE public_id = ?;

-- name: CleanupDeletedMemos :execrows
DELETE FROM memos WHERE is_deleted = true AND date(updated_at) < date('now','-30 days');

-- name: ListTags :many
SELECT *
FROM tags
WHERE tag > @page_after
ORDER BY tag ASC
LIMIT @page_size;

-- name: CreateTag :exec
INSERT INTO tags(
    tag,
    count
) VALUES (?, 1)
ON CONFLICT (tag)
DO UPDATE SET
    updated_at  = strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP);

-- name: UpdateTagCount :exec
UPDATE tags SET
    count = (SELECT COUNT(*) FROM memo_tags WHERE memo_tags.tag = tags.tag),
    updated_at  = strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)
WHERE tags.tag in (sqlc.slice('tags'));

-- name: CleanupTagsWithNoCount :exec
DELETE FROM tags WHERE count = 0;

-- name: CreateMemoTagConnection :exec
INSERT INTO memo_tags(
    memo_id,
    tag
) VALUES (?, ?)
ON CONFLICT (memo_id, tag) DO NOTHING;

-- name: CleanupeMemoTagConnection :many
DELETE FROM memo_tags WHERE memo_id = @memo_id AND tag NOT IN (sqlc.slice('tags')) RETURNING tag;

-- name: DeleteMemoTagConnections :many
DELETE FROM memo_tags WHERE memo_id = ? RETURNING tag;

