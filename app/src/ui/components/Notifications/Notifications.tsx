import clsx from "clsx"
import React from "react"

import { Button } from "@/ui/components/Button"
import { InfoIcon, WarningIcon, XIcon } from "@/ui/components/Icons"
import type { Notification as NotificationT } from "@/ui/notifications"

export interface NotificationsProps {
    className?: string
}

export function Notifications(_: NotificationsProps) {
    return <div />
}

export function _Notification({
    n,
    ariaLabelCloseBtn,
}: {
    n: NotificationT
    ariaLabelCloseBtn: string
    onOpenChange: (open: boolean) => void
}) {
    return (
        <div className={clsx("notification", n.type)}>
            <h2 className="notification-title">
                <div className="icon">{n.type === "info" ? <InfoIcon /> : <WarningIcon />}</div>
                {n.title}
            </h2>
            <Button className="notification-close" aria-label={ariaLabelCloseBtn}>
                <XIcon aria-hidden />
            </Button>
            <p className="notification-message">{n.message}</p>

            <div className="notification-buttons">
                {n.buttons?.map((btn) => (
                    <div key={btn["aria-label"]}>
                        <Button {...btn} />
                    </div>
                ))}
            </div>
        </div>
    )
}

export function _PermanentNotification({
    n,
    ariaLabelCloseBtn,
    onOpenChange,
}: {
    n: NotificationT
    ariaLabelCloseBtn: string
    onOpenChange: (open: boolean) => void
}) {
    return (
        <div className={clsx("notification pointer-events-auto", n.type)}>
            <div className="notification-title">
                <div className="icon">{n.type === "info" ? <InfoIcon /> : <WarningIcon />}</div>
                {n.title}
            </div>
            <button
                type="button"
                className="notification-close"
                aria-label={ariaLabelCloseBtn}
                onClick={() => onOpenChange(false)}
            >
                <XIcon />
            </button>
            <div className="notification-message">{n.message}</div>

            <div className="notification-buttons">
                {n.buttons?.map((btn) => (
                    <Button
                        {...btn}
                        key={btn["aria-label"]}
                        onClick={(e) => {
                            onOpenChange(false)
                            btn.onClick?.(e)
                        }}
                    />
                ))}
            </div>
        </div>
    )
}
