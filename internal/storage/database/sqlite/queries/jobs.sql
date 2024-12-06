-- name: ListNextJobs :many
SELECT *
FROM jobs
WHERE
    datetime(scheduled_for) <= datetime(CAST(@scheduled_for AS TEXT))
    AND state = "scheduled"
ORDER BY scheduled_for DESC;

-- name: GetNextWakeUpTime :one
SELECT scheduled_for
FROM jobs
WHERE state = "scheduled"
ORDER BY scheduled_for DESC
LIMIT 1;


-- name: CreateJob :exec
INSERT INTO jobs(
    kind,
    data,
    scheduled_for,
    created_by
) VALUES (?, ?, ?, ?);

-- name: UpdateJob :exec
UPDATE jobs
SET
    state = ?,
    result = ?,
    finished_at = ?
WHERE id = ?;
