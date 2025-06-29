import React from "react"

import { useBuildInfo } from "@/ui/hooks/useBuildInfo"
import { useT } from "@/ui/i18n"

export function AboutTab() {
    let t = useT("screens/Settings/About")
    let buildInfo = useBuildInfo()

    return (
        <div className="flex flex-col h-full">
            <header className="text-center">
                <h2 className="block">{t.Title}</h2>
                <span className="block">{buildInfo.version}</span>
            </header>

            <div className="settings-section flex-1 flex flex-col justify-between">
                <dl>
                    <div className="flex gap-2">
                        <dt>{t.VersionLabel}</dt>
                        <dd className="font-semibold">
                            {buildInfo.version} (
                            {buildInfo.commitHash.substring(0, 7)}
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
                    <div className="flex gap-2">
                        <dt>{t.PublishDateLabel}</dt>
                        <dd className="font-semibold">
                            {buildInfo.commitDate}
                        </dd>
                    </div>

                    {buildInfo.server && (
                        <>
                            <div className="flex gap-2">
                                <dt>{t.ServerVersionLabel}</dt>
                                <dd className="font-semibold">
                                    {buildInfo.server.version}
                                    {buildInfo.server.commitHash &&
                                        `(${buildInfo.server.commitHash.substring(
                                            0,
                                            7,
                                        )})`}
                                </dd>
                            </div>
                            <div className="flex gap-2">
                                <dt>{t.ServerPublishDateLabel}</dt>
                                <dd className="font-semibold">
                                    {buildInfo.server.commitDate}
                                </dd>
                            </div>
                            <div className="flex gap-2">
                                <dt>{t.ServerGoVersionLabel}</dt>
                                <dd className="font-semibold">
                                    {buildInfo.server.goVersion}
                                </dd>
                            </div>
                        </>
                    )}
                </dl>

                <a
                    className="block text-center text-primary hover:underline text-xs"
                    target="_github"
                    href={buildInfo.projectLink}
                >
                    {buildInfo.projectLink.replace("https://", "")}
                </a>
            </div>
        </div>
    )
}
