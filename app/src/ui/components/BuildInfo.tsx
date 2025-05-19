import clsx from "clsx"
import React from "react"

import { useBuildInfo } from "../hooks/useBuildInfo"

export const BuildInfo = React.memo(function BuildInfo({
    className,
}: { className?: string }) {
    let buildInfo = useBuildInfo()
    return (
        <div
            className={clsx(
                "text-sm text-subtle-dark dark:text-subtle",
                className,
            )}
        >
            {buildInfo.version}@
            <a
                href={buildInfo.projectLink}
                className="hover:text-primary"
                target="_github"
            >
                {buildInfo.commitHash.substring(0, 7)}
            </a>{" "}
            ({buildInfo.commitDate})
        </div>
    )
})
