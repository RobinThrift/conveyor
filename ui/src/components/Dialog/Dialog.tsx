import { Button, type ButtonProps } from "@/components//Button"
import { Dialog as BaseUIDialog } from "@base-ui-components/react/dialog"
import { X } from "@phosphor-icons/react"
import clsx from "clsx"
import React from "react"

export interface DialogProps extends BaseUIDialog.Root.Props {}

export function Dialog(props: DialogProps) {
    return <BaseUIDialog.Root {...props} />
}

Dialog.Trigger = DialogTrigger
Dialog.Content = DialogContent
Dialog.Title = DialogTitle
Dialog.Description = DialogDescription
Dialog.Buttons = DialogButtons
Dialog.CloseButton = DialogCloseButton

export interface DialogTriggerProps extends ButtonProps {}

export function DialogTrigger(props: DialogTriggerProps) {
    return (
        <BaseUIDialog.Trigger
            disabled={props.disabled}
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

export interface DialogContentProps extends BaseUIDialog.Popup.Props {
    withCloseButton?: boolean
}

export function DialogContent({
    withCloseButton = true,
    className,
    ...props
}: DialogContentProps) {
    return (
        <BaseUIDialog.Portal>
            <BaseUIDialog.Backdrop className="dialog-backdrop" />
            <BaseUIDialog.Popup
                className={clsx("dialog", className)}
                {...props}
            >
                {withCloseButton && (
                    <BaseUIDialog.Close
                        render={(closeProps) => {
                            return (
                                <Button
                                    iconRight={<X />}
                                    ariaLabel="Close"
                                    className="dialog-close"
                                    plain
                                    {...closeProps}
                                />
                            )
                        }}
                    />
                )}

                {props.children}
            </BaseUIDialog.Popup>
        </BaseUIDialog.Portal>
    )
}

export type DialogTitleProps = BaseUIDialog.Title.Props

export function DialogTitle({ className, ...props }: DialogTitleProps) {
    return (
        <BaseUIDialog.Title
            className={clsx("dialog-title", className)}
            {...props}
        >
            {props.children}
        </BaseUIDialog.Title>
    )
}

export type DialogDescriptionProps = BaseUIDialog.Description.Props

export function DialogDescription({
    className,
    ...props
}: DialogDescriptionProps) {
    return (
        <BaseUIDialog.Description
            className={clsx("dialog-description", className)}
            {...props}
        >
            {props.children}
        </BaseUIDialog.Description>
    )
}

export function DialogButtons({
    className,
    children,
}: React.PropsWithChildren<{ className?: string }>) {
    return <div className={clsx("dialog-btns", className)}>{children}</div>
}

export type DialogCloseButtonProps = ButtonProps

export function DialogCloseButton({
    className,
    ...props
}: DialogCloseButtonProps) {
    return (
        <BaseUIDialog.Close
            render={(closeProps) => (
                <Button
                    outline
                    {...props}
                    {...closeProps}
                    className={clsx("dialog-close-btn", className)}
                />
            )}
        />
    )
}
