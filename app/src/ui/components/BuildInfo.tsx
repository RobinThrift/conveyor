import { BUILD_INFO } from "@/domain/BuildInfo"
import clsx from "clsx"
import React from "react"

export const BuildInfo = React.memo(function BuildInfo({
    className,
}: { className?: string }) {
    return (
        <div
            className={clsx(
                "text-sm text-subtle-dark dark:text-subtle",
                className,
            )}
        >
            {BUILD_INFO.version}@
            <a
                href={BUILD_INFO.projectLink}
                className="hover:text-primary"
                target="_github"
            >
                {BUILD_INFO.commitHash.substring(0, 7)}
            </a>{" "}
            ({BUILD_INFO.commitDate})
        </div>
    )
})
