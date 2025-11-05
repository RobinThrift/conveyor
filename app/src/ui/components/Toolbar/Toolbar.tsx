/** biome-ignore-all lint/a11y/useSemanticElements: follows best practices */
import clsx from "clsx"
import React, { startTransition, useCallback, useEffect, useRef, useState } from "react"

import { CaretUpIcon } from "@/ui/components/Icons"
import { useOnResize } from "@/ui/hooks/useOnResize"
import { useT } from "@/ui/i18n"

export type ToolbarProps = React.PropsWithChildren<{
    label: string
    className?: string
    ref?: React.RefObject<HTMLDivElement | null>
}>

export const Toolbar = React.memo(function Toolbar({
    className,
    children,
    label,
    ref: extRef,
}: ToolbarProps) {
    let t = useT("components/Toolbar")
    let _ref = useRef<HTMLDivElement | null>(null)
    let ref = extRef ?? _ref
    let size = useOnResize(ref)
    let [clientWidth, setClientWidth] = useState(0)
    let [isExtended, setIsExtended] = useState(false)
    let [hasOverflow, setHasOverflow] = useState(false)

    useEffect(() => {
        startTransition(() => {
            if (size.clientWidth === clientWidth) {
                return
            }

            setClientWidth(size.clientWidth)

            if (size.scrollWidth > size.clientWidth) {
                setHasOverflow(true)
            }
        })
    }, [size.clientWidth, size.scrollWidth, clientWidth])

    let toggleIsExtended = useCallback(() => {
        setIsExtended((e) => !e)
    }, [])

    return (
        <div
            ref={ref}
            className={clsx(
                "toolbar",
                {
                    "has-overflow": hasOverflow,
                    "is-extended": isExtended,
                },
                className,
            )}
            role="toolbar"
            aria-label={label}
        >
            <div className="toolbar-btn-wrapper">
                {children}
                <ToolbarButton
                    label={isExtended ? t.Extend : t.Collapse}
                    icon={<CaretUpIcon />}
                    className="tooltip-extend-btn"
                    action={toggleIsExtended}
                    aria-pressed={isExtended}
                />
            </div>
        </div>
    )
})

export const ToolbarButtonGroup = React.memo(function ToolbarButtonGroup({
    label,
    children,
}: React.PropsWithChildren<{ label: string }>) {
    return (
        <div aria-label={label} className="toolbar-btn-grp" role="group">
            {children}
        </div>
    )
})

export type ToolbarButtonProps = React.PropsWithChildren<{
    className?: string
    action: () => void
    icon: React.ReactNode
    label: string
    "aria-pressed"?: boolean
}>

export const ToolbarButton = React.memo(function ToolbarButton({
    className,
    label,
    action,
    children,
    icon,
    ...props
}: ToolbarButtonProps) {
    let tooltip = useRef<HTMLDivElement | null>(null)

    let onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLButtonElement>) => {
            e.preventDefault()
            action()
        },
        [action],
    )

    let onKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLButtonElement>) => {
            if (e.code === "Enter" || e.code === "Space") {
                action()
            }
        },
        [action],
    )

    let onPointerEnter = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
        let target = e.target as HTMLElement
        if (target.tagName !== "BUTTON") {
            target = target.closest("button") as HTMLElement
        }
        // @ts-expect-error: in newer api version
        tooltip.current?.showPopover({ source: target })
    }, [])

    let onPointerLeave = useCallback(() => {
        tooltip.current?.hidePopover()
    }, [])

    let onFocus = useCallback((e: React.FocusEvent<HTMLButtonElement, Element>) => {
        let target = e.target as HTMLElement
        if (target.tagName !== "BUTTON") {
            target = target.closest("button") as HTMLElement
        }
        // @ts-expect-error: in newer api version
        tooltip.current?.showPopover({ source: target })
    }, [])

    let onBlur = useCallback(() => {
        tooltip.current?.hidePopover()
    }, [])

    return (
        <button
            type="button"
            className={clsx("toolbar-btn", className)}
            aria-label={label}
            aria-pressed={props["aria-pressed"]}
            onPointerDown={onPointerDown}
            onKeyDown={onKeyDown}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            onFocus={onFocus}
            onBlur={onBlur}
        >
            <span className="icon" aria-hidden="true">
                {icon}
            </span>
            {children}
            <div ref={tooltip} className="tooltip toolbar-btn-tooltip" popover="hint">
                {label}
            </div>
        </button>
    )
})

export const ToolbarSeparator = React.memo(function ToolbarSeparator() {
    // biome-ignore lint/a11y/useFocusableInteractive: false positive
    // biome-ignore lint/a11y/useAriaPropsForRole: false positive
    return <div className="toolbar-separator" aria-orientation="vertical" role="separator" />
})
