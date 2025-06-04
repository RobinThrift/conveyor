import React, { useActionState, useCallback, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

import { Alert } from "@/ui/components/Alert"
import { Button } from "@/ui/components/Button"
import { Form } from "@/ui/components/Form"
import { Input } from "@/ui/components/Input"
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

                <ExportJob />
            </ul>
        </div>
    )
}

const exportJobSelector = createSelector(
    [(state) => selectors.jobs.getJob(state, "export")],
    (state) => ({ ...state }),
)

function ExportJob() {
    let t = useT("screens/Settings/Data/Jobs")
    let dispatch = useDispatch()
    let jobState = useSelector(exportJobSelector)
    let filename = "export.db"

    let isRunning =
        jobState?.status === "running" || jobState?.status === "requested"

    let [_, startJob] = useActionState((_: unknown, formData: FormData) => {
        dispatch(
            actions.jobs.startJob({
                job: "export",
                params: {
                    filename,
                    privateKey: formData.get("private_key"),
                },
            }),
        )
        return null
    }, null)

    useEffect(() => {
        if (jobState?.status === "done") {
            // dispatch(actions.jobs.resetJob({ job: "export" }))
            downloadDB(filename).catch((err) => console.error(err))
        }
    }, [jobState?.status, filename])

    return (
        <li className="flex flex-col">
            <Form action={startJob}>
                <div>
                    <strong>{t.ExportJobLabel}</strong>:{" "}
                    {t.ExportJobDescription}
                </div>

                <Input
                    name="private_key"
                    type="password"
                    label={t.ExportJobPrivateKeyLabel}
                    className="my-2 md:flex md:items-center md:gap-2"
                    disabled={isRunning}
                />

                <Button
                    variant="primary"
                    type="submit"
                    className="w-fit"
                    size="sm"
                    isDisabled={isRunning}
                >
                    {isRunning ? t.RunningLabel : t.RunLabel}
                </Button>

                {jobState?.error ? (
                    <Alert variant="danger">
                        {jobState?.error.name}: {jobState?.error.message}
                        {jobState?.error.stack && (
                            <pre>
                                <code>{jobState?.error.stack}</code>
                            </pre>
                        )}
                    </Alert>
                ) : undefined}
            </Form>
        </li>
    )
}

async function downloadDB(filename: string) {
    let root = await navigator.storage.getDirectory()

    let file = await root.getFileHandle(filename)

    let objURL = URL.createObjectURL(await file.getFile())

    let fauxDownloadEl = document.createElement("a")
    fauxDownloadEl.href = objURL
    fauxDownloadEl.download = filename
    document.body.appendChild(fauxDownloadEl)
    fauxDownloadEl.click()
    fauxDownloadEl.remove()

    URL.revokeObjectURL(objURL)
}
