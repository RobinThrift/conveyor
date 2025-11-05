import clsx from "clsx"
import React, { useCallback, useId, useRef, useState } from "react"

import { InfoIcon } from "@/ui/components/Icons"

export interface InfoPopoverProps {
    className?: string
    buttonClassName?: string

    children: React.ReactNode | React.ReactNode[]
    "aria-label": string

    isDisabled?: boolean
}

export function InfoPopover(props: InfoPopoverProps) {
    let { targetID, popover, isOpen, onKeyDown, onBeforeToggle } = useInfoPopover()

    return (
        <>
            <button
                type="button"
                className={clsx(
                    "info-popover-trigger",
                    { "is-open": isOpen },
                    props.buttonClassName,
                )}
                aria-label={props["aria-label"]}
                disabled={props.isDisabled}
                popoverTargetAction="toggle"
                popoverTarget={targetID}
                onKeyDown={onKeyDown}
            >
                <InfoIcon aria-hidden="true" />
            </button>
            <div
                className={clsx("info-popover", props.className)}
                popover="auto"
                id={targetID}
                ref={popover}
                onBeforeToggle={onBeforeToggle}
            >
                <div className="info-popover-content">{props.children}</div>
            </div>
        </>
    )
}

function useInfoPopover() {
    let targetID = useId()
    let popover = useRef<HTMLDivElement | null>(null)
    let [isOpen, setIsOpen] = useState(false)
    let open = useCallback((src?: HTMLElement) => {
        if (!popover.current) {
            return
        }

        // @ts-expect-error: in newer api version
        popover.current.showPopover({ source: src })

        setIsOpen(true)
    }, [])

    let close = useCallback(() => {
        setIsOpen(false)
        popover.current?.hidePopover()
    }, [])

    let onKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLButtonElement>) => {
            switch (e.code) {
                case "Space":
                case "Enter":
                    if (isOpen) {
                        close()
                    } else {
                        open(e.target as HTMLElement)
                    }
                    e.preventDefault()
                    break
                case "ArrowDown":
                    open(e.target as HTMLElement)
                    break
                case "ArrowUp":
                    close()
                    break
            }
        },
        [isOpen, open, close],
    )

    let onBeforeToggle = useCallback((e: React.ToggleEvent<HTMLDivElement>) => {
        if (e.nativeEvent.newState === "open") {
            setIsOpen(true)
        } else {
            setIsOpen(false)
        }
    }, [])

    return {
        targetID,
        popover,
        isOpen,
        close,
        onKeyDown,
        onBeforeToggle,
    }
}
