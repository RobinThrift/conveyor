import { AlertDialog as BaseUIAlertDialog } from "@base-ui-components/react/alert-dialog"
import clsx from "clsx"
import React from "react"

import { Button, type ButtonProps } from "@/ui/components/Button"
import { useT } from "@/ui/i18n"

export interface AlertDialogProps extends BaseUIAlertDialog.Root.Props {}

export function AlertDialog(props: AlertDialogProps) {
    return <BaseUIAlertDialog.Root {...props} />
}

AlertDialog.Trigger = AlertDialogTrigger
AlertDialog.Content = AlertDialogContent
AlertDialog.Title = AlertDialogTitle
AlertDialog.Description = AlertDialogDescription
AlertDialog.Buttons = AlertDialogButtons
AlertDialog.CancelButton = AlertDialogCancelButton
AlertDialog.Icon = AlertDialogIcon

export interface AlertDialogTriggerProps extends ButtonProps {}

export function AlertDialogTrigger(props: AlertDialogTriggerProps) {
    return (
        <BaseUIAlertDialog.Trigger
            disabled={props.isDisabled}
            render={(triggerProps) => (
                <Button
                    {...props}
                    {...triggerProps}
                    className={clsx("dialog-btn", props.className)}
                />
            )}
        />
    )
}

export type AlertDialogContentProps = BaseUIAlertDialog.Popup.Props

export function AlertDialogContent({ className, ...props }: AlertDialogContentProps) {
    return (
        <BaseUIAlertDialog.Portal>
            <BaseUIAlertDialog.Backdrop className="dialog-backdrop alert-dialog" />
            <BaseUIAlertDialog.Popup
                className={clsx("dialog alert-dialog", className)}
                {...props}
            />
        </BaseUIAlertDialog.Portal>
    )
}

export type AlertDialogTitleProps = BaseUIAlertDialog.Title.Props

export function AlertDialogTitle({ className, ...props }: AlertDialogTitleProps) {
    return (
        <BaseUIAlertDialog.Title className={clsx("dialog-title", className)} {...props}>
            {props.children}
        </BaseUIAlertDialog.Title>
    )
}

export type AlertDialogDescriptionProps = BaseUIAlertDialog.Description.Props

export function AlertDialogDescription({ className, ...props }: AlertDialogDescriptionProps) {
    return (
        <BaseUIAlertDialog.Description className={clsx("dialog-description", className)} {...props}>
            {props.children}
        </BaseUIAlertDialog.Description>
    )
}

export function AlertDialogButtons({
    className,
    children,
}: React.PropsWithChildren<{ className?: string }>) {
    return <div className={clsx("dialog-btns", className)}>{children}</div>
}

export type AlertDialogCancelButtonProps = ButtonProps

export function AlertDialogCancelButton({
    className,
    children: orgChildren,
    ...props
}: AlertDialogCancelButtonProps) {
    let t = useT("components/AlertDialog")
    let children = orgChildren
    if (!children) {
        children = [t.CancelButtonLabel]
    }

    return (
        <BaseUIAlertDialog.Close
            render={(closeProps) => (
                <Button
                    plain
                    {...props}
                    {...closeProps}
                    className={clsx("dialog-close-btn", className)}
                >
                    {children}
                </Button>
            )}
        />
    )
}

export function AlertDialogIcon(props: React.PropsWithChildren<{ className?: string }>) {
    return <div className={clsx("alert-dialog-icon", props.className)}>{props.children}</div>
}
