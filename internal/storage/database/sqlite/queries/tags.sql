-- name: ListTags :many
SELECT *
FROM tags
WHERE tag > @after
ORDER BY tag DESC
LIMIT @limit;

-- name: CreateTag :exec
INSERT INTO tags(
    tag,
    count
) VALUES (?, ?)
ON CONFLICT (tag)
DO UPDATE SET
    count       = count+1,
    updated_at  = strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP);

-- name: DeleteTag :exec
UPDATE tags SET
    count      = count-1,
    updated_at = strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP)
WHERE tag IN (?);

-- name: CleanupTagsWithNoCount :exec
DELETE FROM tags WHERE count = 0;


-- name: CreateMemoTagConnection :exec
INSERT INTO memo_tags(
    memo_id,
    tag
) VALUES (?, ?)
ON CONFLICT (memo_id, tag) DO NOTHING;

-- name: DeleteMemoTagConnection :exec
DELETE FROM memo_tags WHERE memo_id = ? AND tag = ?;
