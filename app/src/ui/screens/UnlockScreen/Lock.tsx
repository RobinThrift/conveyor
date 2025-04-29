import React from "react"

import { LockIcon } from "@/ui/components/Icons"
import { useT } from "@/ui/i18n"
import clsx from "clsx"

export function Lock({
    unlockState,
}: { unlockState: "locked" | "unlocked" | "unlocking" }) {
    let t = useT("screens/Unlock")

    return (
        <div
            className={clsx("lock", {
                unlocking: unlockState === "unlocking",
                unlocked: unlockState === "unlocked",
            })}
        >
            <div className="icon-wrapper">
                <LockIcon className="lock-icon" />
                <LockIcon className="lock-icon when-unlocking" />
            </div>

            <h1>{t.Title}</h1>
        </div>
    )
}
