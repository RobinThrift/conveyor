import clsx from "clsx"
import React, { useContext } from "react"

import { Button, type ButtonProps } from "@/ui/components/Button"
import { WarningIcon } from "@/ui/components/Icons"
import { useT } from "@/ui/i18n"

import { alertDialogContext } from "./context"
import { useAlertDialog } from "./useAlertDialog"

export type AlertDialogProps = {
    open?: boolean
    children: React.ReactNode | React.ReactNode[]
    onClose?: () => void
}

export function AlertDialog(props: AlertDialogProps) {
    let ctx = useAlertDialog(props)
    return <alertDialogContext.Provider value={ctx}>{props.children}</alertDialogContext.Provider>
}

AlertDialog.Trigger = AlertDialogTrigger
AlertDialog.Content = AlertDialogContent
AlertDialog.Title = AlertDialogTitle
AlertDialog.Description = AlertDialogDescription
AlertDialog.Buttons = AlertDialogButtons
AlertDialog.CancelButton = AlertDialogCancelButton
AlertDialog.Icon = AlertDialogIcon

export interface AlertDialogTriggerProps extends ButtonProps {}

export function AlertDialogTrigger(props: Omit<ButtonProps, "onPress">) {
    let alertDialogCtx = useContext(alertDialogContext)
    if (!alertDialogCtx) {
        throw new Error(
            "<AlertDialogTrigger> must only be rendered inside of a <AlertDialog> component",
        )
    }

    return <Button {...props} onPress={alertDialogCtx.open} />
}

export type AlertDialogContentProps = {
    className?: string
    children: React.ReactNode | React.ReactNode[]
}

export function AlertDialogContent(props: AlertDialogContentProps) {
    let alertDialogCtx = useContext(alertDialogContext)
    if (!alertDialogCtx) {
        throw new Error(
            "<AlertDialogContent> must only be rendered inside of a <AlertDialog> component",
        )
    }

    return (
        <dialog
            ref={alertDialogCtx.ref}
            // biome-ignore lint/a11y/noAutofocus: alert dialog
            autoFocus={true}
            role="alertdialog"
            open={alertDialogCtx.defaultOpen}
            className={clsx("alert-dialog", props.className)}
            aria-labelledby={alertDialogCtx.labelledByID}
            aria-describedby={alertDialogCtx.describedByID}
        >
            {alertDialogCtx.isOpen && props.children}
        </dialog>
    )
}

export type AlertDialogTitleProps = React.HTMLAttributes<HTMLDivElement>

export function AlertDialogTitle({ className, ...props }: AlertDialogTitleProps) {
    let alertDialogCtx = useContext(alertDialogContext)
    if (!alertDialogCtx) {
        throw new Error(
            "<AlertDialogTitle> must only be rendered inside of a <AlertDialog> component",
        )
    }

    return (
        <div
            className={clsx("alert-dialog-title", className)}
            id={alertDialogCtx.labelledByID}
            {...props}
        >
            {props.children}
        </div>
    )
}

export type AlertDialogDescriptionProps = React.HTMLAttributes<HTMLDivElement>

export function AlertDialogDescription({ className, ...props }: AlertDialogDescriptionProps) {
    let alertDialogCtx = useContext(alertDialogContext)
    if (!alertDialogCtx) {
        throw new Error(
            "<AlertDialogDescription> must only be rendered inside of a <AlertDialog> component",
        )
    }

    return (
        <div
            id={alertDialogCtx.describedByID}
            className={clsx("alert-dialog-description", className)}
            {...props}
        >
            {props.children}
        </div>
    )
}

export function AlertDialogButtons({
    className,
    children,
}: React.PropsWithChildren<{ className?: string }>) {
    return <div className={clsx("alert-dialog-btns", className)}>{children}</div>
}

export function AlertDialogCancelButton({ className, ...props }: Omit<ButtonProps, "onPress">) {
    let alertDialogCtx = useContext(alertDialogContext)
    if (!alertDialogCtx) {
        throw new Error(
            "<AlertDialogCloseButton> must only be rendered inside of a <AlertDialog> component",
        )
    }

    let t = useT("components/AlertDialog")
    let children = props.children
    if (!children) {
        children = [t.CancelButtonLabel]
    }

    return (
        <Button
            {...props}
            className={clsx("alert-dialog-close-btn", className)}
            onPress={alertDialogCtx.close}
        >
            {children}
        </Button>
    )
}

export function AlertDialogIcon(props: React.PropsWithChildren<{ className?: string }>) {
    let children = props.children ?? <WarningIcon />
    return (
        <div aria-hidden className={clsx("alert-dialog-icon", props.className)}>
            {children}
        </div>
    )
}
