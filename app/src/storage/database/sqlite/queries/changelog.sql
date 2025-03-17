-- name: ListUnsyncedChanges :many
SELECT *
FROM changelog
WHERE
    CASE WHEN @chlg_page_after IS NOT NULL THEN id > @chlg_page_after ELSE true END
    AND is_synced = false
ORDER BY timestamp ASC, revision ASC
LIMIT @page_size;

-- name: ListUnappliedChanges :many
SELECT *
FROM changelog
WHERE
    CASE WHEN @chlg_page_after IS NOT NULL THEN id > @chlg_page_after ELSE true END
    AND is_applied = false
ORDER BY timestamp ASC, revision ASC
LIMIT @page_size;

-- name: ListChangelogEntriesForID :many
SELECT *
FROM changelog
WHERE target_id = ?
ORDER BY revision ASC, timestamp ASC;

-- name: CreateChangelogEntry :exec
INSERT INTO changelog(
    public_id,
    source,
    revision,
    timestamp,
    target_type,
    target_id,
    value,
    is_synced,
    synced_at,
    is_applied,
    applied_at
) VALUES (
    @public_id,
    @source,
    (CASE WHEN @revision > 0 THEN
        @revision
        ELSE
        COALESCE(
            (SELECT MAX(revision) + 1 as revision FROM changelog WHERE target_type = @target_type AND target_id = @target_id),
            1
        )
    END),
    @timestamp,
    @target_type,
    @target_id,
    @value,
    @is_synced,
    @synced_at,
    @is_applied,
    @applied_at
) ON CONFLICT (public_id) DO NOTHING;

-- name: MarkChangelogEntriesAsSynced :exec
UPDATE changelog
SET is_synced = TRUE, synced_at = COALESCE(synced_at, strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP))
WHERE public_id IN (sqlc.slice('public_ids'));

-- name: MarkChangelogEntriesAsApplied :exec
UPDATE changelog
SET is_applied = TRUE, applied_at = COALESCE(applied_at, strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP))
WHERE public_id IN (sqlc.slice('public_ids'));
