import React, { useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"

import { Alert } from "@/ui/components/Alert"
import { Button } from "@/ui/components/Button"
import { useT } from "@/ui/i18n"
import { actions, selectors } from "@/ui/state"
import { createSelector } from "@reduxjs/toolkit"

export function DataTab() {
    let t = useT("screens/Settings/Data")

    return (
        <div className="h-full space-y-4">
            <div>
                <h2 className="block">{t.Title}</h2>
                <small className="settings-tab-description">
                    {t.Description}
                </small>
            </div>

            <DataJobs />
        </div>
    )
}

const cleanupJobSelector = createSelector(
    [(state) => selectors.jobs.getJob(state, "cleanup")],
    (cleanup) => ({ ...cleanup }),
)

function DataJobs() {
    let t = useT("screens/Settings/Data/Jobs")
    let dispatch = useDispatch()
    let cleanupState = useSelector(cleanupJobSelector)

    let isRunning =
        cleanupState?.status === "running" ||
        cleanupState?.status === "requested"

    let startCleanupJob = useCallback(() => {
        dispatch(actions.jobs.startJob({ job: "cleanup" }))
    }, [dispatch])

    return (
        <div className="settings-section flex-1">
            <h3 className="pb-2 font-semibold text-lg">{t.Title}</h3>
            <ul className="space-y-4">
                <li className="flex flex-col">
                    <div>
                        <strong>{t.CleanupJobLabel}</strong>:{" "}
                        {t.CleanupJobDescription}
                    </div>

                    <Button
                        variant="primary"
                        className="w-fit"
                        size="sm"
                        isDisabled={isRunning}
                        onPress={startCleanupJob}
                    >
                        {isRunning ? t.RunningLabel : t.RunLabel}
                    </Button>

                    {cleanupState?.error ? (
                        <Alert variant="danger">
                            {cleanupState?.error.name}:{" "}
                            {cleanupState?.error.message}
                            {cleanupState?.error.stack && (
                                <pre>
                                    <code>{cleanupState?.error.stack}</code>
                                </pre>
                            )}
                        </Alert>
                    ) : undefined}
                </li>
            </ul>
        </div>
    )
}
