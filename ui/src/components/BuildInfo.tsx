import { serverData } from "@/App/ServerData"
import clsx from "clsx"
import React from "react"

export function BuildInfo({ className }: { className?: string }) {
    return (
        <div className={clsx("text-sm text-subtle", className)}>
            {serverData.buildInfo.version}@
            <a
                href={serverData.buildInfo.projectLink}
                className="hover:text-primary"
                target="_github"
            >
                {serverData.buildInfo.commitHash.substring(0, 7)}
            </a>{" "}
            ({serverData.buildInfo.goVersion}; {serverData.buildInfo.commitDate}
            )
        </div>
    )
}
