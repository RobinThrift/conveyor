-- name: ListUnsyncedChanges :many
SELECT *
FROM changelog
WHERE
    CASE WHEN @chlg_page_after IS NOT NULL THEN id > @chlg_page_after ELSE true END
    AND synced = false
ORDER BY revision
LIMIT @page_size;

-- name: ListUnappliedChanges :many
SELECT *
FROM changelog
WHERE
    CASE WHEN @chlg_page_after IS NOT NULL THEN id > @chlg_page_after ELSE true END
    AND applied = false
ORDER BY revision
LIMIT @page_size;

-- name: CreateChangelogEntry :exec
INSERT INTO changelog(
    source,
    revision,
    target_type,
    target_id,
    value,
    synced,
    applied
) VALUES (
    @source,
    (CASE WHEN @revision > 0 THEN
        @revision
        ELSE
        COALESCE(
            (SELECT MAX(revision) + 1 as revision FROM changelog WHERE target_type = @target_type AND target_id = @target_id),
            1
        )
    END),
    @target_type,
    @target_id,
    @value,
    @synced,
    @applied
);
