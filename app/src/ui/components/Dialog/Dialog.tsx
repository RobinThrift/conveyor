import clsx from "clsx"
import React, { Activity, useContext } from "react"

import { Button, type ButtonProps } from "@/ui/components/Button"
import { XIcon } from "@/ui/components/Icons"

import { dialogContext } from "./context"
import { useDialog, useDialogDragHandle } from "./useDialog"

export type DialogProps = {
    open?: boolean
    isModal?: boolean
    isKeyboardDismissable?: boolean
    autofocus?: boolean
    children: React.ReactNode | React.ReactNode[]
    defaultOpen?: boolean
    onClose?: () => void
}

export function Dialog(props: DialogProps) {
    let ctx = useDialog(props)
    return <dialogContext.Provider value={ctx}>{props.children}</dialogContext.Provider>
}

Dialog.Content = DialogContent
Dialog.Trigger = DialogTrigger
Dialog.Title = DialogTitle
Dialog.Description = DialogDescription
Dialog.Buttons = DialogButtons
Dialog.CloseButton = DialogCloseButton

export type DialogContentProps = {
    className?: string
    withCloseButton?: boolean
    children: React.ReactNode | React.ReactNode[]
}

export function DialogContent(props: DialogContentProps) {
    let dialogCtx = useContext(dialogContext)
    let { onPointerDown, onPointerCancel, onPointerMove } = useDialogDragHandle({
        ref: dialogCtx?.ref ?? (undefined as any),
        onClose: dialogCtx?.close ?? (() => {}),
    })

    if (!dialogCtx) {
        throw new Error("<DialogContent> component called outside of <Dialog> component")
    }

    let withCloseButton = props.withCloseButton ?? true

    return (
        <dialog
            ref={dialogCtx.ref}
            // biome-ignore lint/a11y/noAutofocus: controlled by prop
            autoFocus={dialogCtx.autofocus}
            open={dialogCtx.defaultOpen}
            className={clsx("dialog", { "is-modal": dialogCtx.isModal }, props.className)}
            aria-labelledby={dialogCtx.labelledByID}
            aria-describedby={dialogCtx.describedByID}
            style={{ "--nested-dialogs": 0 } as React.CSSProperties}
        >
            <Activity mode={dialogCtx.isOpen ? "visible" : "hidden"}>
                {withCloseButton && (
                    <DialogCloseButton
                        iconRight={<XIcon />}
                        aria-label="Close"
                        className="dialog-close-btn"
                    />
                )}

                {props.children}

                <div
                    className="dialog-drag-handle"
                    onPointerDown={onPointerDown}
                    onPointerUp={onPointerCancel}
                    onPointerMove={onPointerMove}
                    onPointerCancel={onPointerCancel}
                />
            </Activity>
        </dialog>
    )
}

export function DialogTrigger(props: Omit<ButtonProps, "onClick">) {
    let dialogCtx = useContext(dialogContext)
    if (!dialogCtx) {
        throw new Error("<DialogTrigger> component called outside of <Dialog> component")
    }

    return <Button {...props} onClick={dialogCtx.open} />
}

export type DialogTitleProps = React.HTMLAttributes<HTMLDivElement>

export function DialogTitle({ className, ...props }: DialogTitleProps) {
    let dialogCtx = useContext(dialogContext)
    if (!dialogCtx) {
        throw new Error("<DialogTitle> component called outside of <Dialog> component")
    }

    return (
        <div className={clsx("dialog-title", className)} id={dialogCtx.labelledByID} {...props}>
            {props.children}
        </div>
    )
}

export type DialogDescriptionProps = React.HTMLAttributes<HTMLDivElement>

export function DialogDescription({ className, ...props }: DialogDescriptionProps) {
    let dialogCtx = useContext(dialogContext)
    if (!dialogCtx) {
        throw new Error("<DialogDescription> component called outside of <Dialog> component")
    }

    return (
        <div
            id={dialogCtx.describedByID}
            className={clsx("dialog-description", className)}
            {...props}
        >
            {props.children}
        </div>
    )
}

export function DialogButtons({
    className,
    children,
}: React.PropsWithChildren<{ className?: string }>) {
    return <div className={clsx("dialog-btns", className)}>{children}</div>
}

export function DialogCloseButton({ className, ...props }: Omit<ButtonProps, "onClick">) {
    let dialogCtx = useContext(dialogContext)
    if (!dialogCtx) {
        throw new Error("<DialogCloseButton> component called outside of <Dialog> component")
    }
    return (
        <Button
            {...props}
            className={clsx("dialog-close-btn", className)}
            onClick={dialogCtx.close}
        />
    )
}
