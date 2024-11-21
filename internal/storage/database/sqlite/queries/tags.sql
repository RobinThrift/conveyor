-- name: ListTags :many
SELECT *
FROM tags
WHERE tag > @page_after
ORDER BY tag DESC
LIMIT @page_size;

-- name: CreateTag :exec
INSERT INTO tags(
    tag,
    count,
	created_by
) VALUES (?, 1, ?)
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

-- name: DeleteMemoTagConnection :many
DELETE FROM memo_tags WHERE memo_id = ? RETURNING tag;
