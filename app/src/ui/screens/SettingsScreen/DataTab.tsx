import { useStore } from "@tanstack/react-store"
import React, { useActionState, useCallback, useEffect } from "react"

import { Alert } from "@/ui/components/Alert"
import { Button } from "@/ui/components/Button"
import { Form } from "@/ui/components/Form"
import { Input } from "@/ui/components/Input"
import { useT } from "@/ui/i18n"
import { actions, selectors, stores } from "@/ui/stores"

export function DataTab() {
    let t = useT("screens/Settings/Data")

    return (
        <div className="h-full space-y-4">
            <div>
                <h2 className="block">{t.Title}</h2>
                <small className="settings-tab-description">{t.Description}</small>
            </div>

            <DataJobs />
        </div>
    )
}

function DataJobs() {
    let t = useT("screens/Settings/Data/Jobs")
    let cleanupJob = useStore(stores.jobs.currentJob, (state) =>
        state?.name === "cleanup" ? state : undefined,
    )
    let isReady = useStore(stores.jobs.currentJob, selectors.jobs.isReady)
    let isRunning = cleanupJob?.status === "running" || cleanupJob?.status === "requested"

    let startCleanupJob = useCallback(() => {
        actions.jobs.startJob("cleanup")
    }, [])

    return (
        <div className="settings-section flex-1">
            <h3 className="pb-2 font-semibold text-lg">{t.Title}</h3>
            <ul className="space-y-4">
                <li className="flex flex-col">
                    <div>
                        <strong>{t.CleanupJobLabel}</strong>: {t.CleanupJobDescription}
                    </div>

                    <Button
                        variant="primary"
                        className="w-fit"
                        size="sm"
                        isDisabled={isRunning || !isReady}
                        onPress={startCleanupJob}
                    >
                        {isRunning ? t.RunningLabel : t.RunLabel}
                    </Button>

                    {cleanupJob?.error ? (
                        <Alert variant="danger">
                            {cleanupJob?.error.name}: {cleanupJob?.error.message}
                            {cleanupJob?.error.stack && (
                                <pre>
                                    <code>{cleanupJob?.error.stack}</code>
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

function ExportJob() {
    let t = useT("screens/Settings/Data/Jobs")
    let jobState = useStore(stores.jobs.currentJob, (state) =>
        state?.name === "export" ? state : undefined,
    )
    let isReady = useStore(stores.jobs.currentJob, selectors.jobs.isReady)
    let isRunning = jobState?.status === "running" || jobState?.status === "requested"

    let [_, startJob] = useActionState((_: unknown, formData: FormData) => {
        actions.jobs.startJob("export", {
            privateKey: formData.get("private_key"),
        })
        return null
    }, null)

    useEffect(() => {
        if (jobState?.status === "done") {
            downloadDB("export.db").catch((err) => console.error(err))
        }
    }, [jobState?.status])

    return (
        <li className="flex flex-col">
            <Form action={startJob}>
                <div>
                    <strong>{t.ExportJobLabel}</strong>: {t.ExportJobDescription}
                </div>

                <Input
                    name="private_key"
                    type="password"
                    label={t.ExportJobPrivateKeyLabel}
                    className="my-2 md:flex md:items-center md:gap-2"
                    disabled={isRunning || !isReady}
                />

                <Button
                    variant="primary"
                    type="submit"
                    className="w-fit"
                    size="sm"
                    isDisabled={isRunning || !isReady}
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
