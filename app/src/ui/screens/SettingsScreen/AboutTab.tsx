import { useStore } from "@tanstack/react-store"
import React, { useCallback } from "react"
import { Alert } from "@/ui/components/Alert"
import { Button } from "@/ui/components/Button"
import { useBuildInfo } from "@/ui/hooks/useBuildInfo"
import { useT } from "@/ui/i18n"
import { actions, stores } from "@/ui/stores"

export function AboutTab() {
    let t = useT("screens/Settings/About")
    let buildInfo = useBuildInfo()

    return (
        <div className="flex flex-col h-full">
            <header className="text-center">
                <h2 className="block">{t.Title}</h2>
            </header>

            <div className="settings-section">
                <dl>
                    <div className="flex gap-2">
                        <dt>{t.VersionLabel}</dt>
                        <dd className="font-semibold">
                            {buildInfo.version} ({buildInfo.commitHash.substring(0, 7)}
                            {") "}
                            <a
                                className="text-primary hover:underline focus:outline"
                                target="changelog"
                                href={`${buildInfo.projectLink}/blob/main/CHANGELOG/CHANGELOG-${buildInfo.version}.md`}
                            >
                                {t.ChangelogLink}
                            </a>
                        </dd>
                    </div>

                    <Update />

                    <div className="flex gap-2">
                        <dt>{t.PublishDateLabel}</dt>
                        <dd className="font-semibold">{buildInfo.commitDate}</dd>
                    </div>

                    {buildInfo.server && (
                        <>
                            <hr />
                            <div className="flex gap-2">
                                <dt>{t.ServerVersionLabel}</dt>
                                <dd className="font-semibold">
                                    {buildInfo.server.version}
                                    {buildInfo.server.commitHash &&
                                        `(${buildInfo.server.commitHash.substring(0, 7)})`}
                                </dd>
                            </div>
                            <div className="flex gap-2">
                                <dt>{t.ServerPublishDateLabel}</dt>
                                <dd className="font-semibold">{buildInfo.server.commitDate}</dd>
                            </div>
                            <div className="flex gap-2">
                                <dt>{t.ServerGoVersionLabel}</dt>
                                <dd className="font-semibold">{buildInfo.server.goVersion}</dd>
                            </div>
                        </>
                    )}
                </dl>
            </div>

            <div className="settings-section">
                <div className="flex gap-2">
                    <dt>{t.IconLicenseLabel}</dt>
                    <dd className="font-semibold">
                        <a href="https://github.com/saoudi-h/solar-icons">Solar Icons</a>
                        CC BY 4.0 by{" "}
                        <a href="https://www.figma.com/community/file/1166831539721848736">
                            480 Design
                        </a>
                    </dd>
                </div>
            </div>

            <div className="flex-1 flex justify-center items-end">
                <a
                    className="block text-center text-primary hover:underline text-xs mt-2"
                    target="_github"
                    href={buildInfo.projectLink}
                >
                    {buildInfo.projectLink.replace("https://", "")}
                </a>
            </div>
        </div>
    )
}

function Update() {
    let t = useT("screens/Settings/About")
    let needsUpdate = useStore(stores.sw.needsUpdate)
    let updateErr = useStore(stores.sw.updateErr)

    let onClick = useCallback(() => {
        actions.sw.triggerUpdate()
    }, [])

    if (!needsUpdate && !updateErr) {
        return null
    }

    return (
        <div className="mt-2 mb-4">
            {needsUpdate && (
                <Button variant="primary" onClick={onClick}>
                    {t.UpdateButton}
                </Button>
            )}
            {updateErr && (
                <Alert>
                    <pre>{updateErr.toString()}</pre>
                </Alert>
            )}
        </div>
    )
}
