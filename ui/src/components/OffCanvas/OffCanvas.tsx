import { Dialog as BaseUIDialog } from "@base-ui-components/react/dialog"
import clsx from "clsx"
import React from "react"

import { Button, type ButtonProps } from "@/components//Button"

export interface OffCanvasProps extends BaseUIDialog.Root.Props {}

export function OffCanvas(props: OffCanvasProps) {
    return <BaseUIDialog.Root {...props} />
}

OffCanvas.Trigger = OffCanvasTrigger
OffCanvas.Content = OffCanvasContent
OffCanvas.Description = OffCanvasDescription
OffCanvas.Title = OffCanvasTitle

export interface OffCanvasTriggerProps extends ButtonProps {}

export function OffCanvasTrigger(props: OffCanvasTriggerProps) {
    return (
        <BaseUIDialog.Trigger
            disabled={props.disabled}
            render={(triggerProps) => (
                <Button
                    {...props}
                    {...triggerProps}
                    className={clsx("offcanvas-btn", props.className)}
                />
            )}
        />
    )
}

export type OffCanvasContentProps = BaseUIDialog.Popup.Props

export function OffCanvasContent({
    className,
    ...props
}: OffCanvasContentProps) {
    return (
        <BaseUIDialog.Portal>
            <BaseUIDialog.Backdrop className="offcanvas-backdrop" />
            <BaseUIDialog.Popup
                className={clsx("offcanvas", className)}
                {...props}
            >
                {props.children}
            </BaseUIDialog.Popup>
        </BaseUIDialog.Portal>
    )
}

export type OffCanvasTitleProps = BaseUIDialog.Title.Props

export function OffCanvasTitle({ className, ...props }: OffCanvasTitleProps) {
    return (
        <BaseUIDialog.Title
            className={clsx("offcanvas-title", className)}
            {...props}
        >
            {props.children}
        </BaseUIDialog.Title>
    )
}

export type OffCanvasDescriptionProps = BaseUIDialog.Description.Props

export function OffCanvasDescription({
    className,
    ...props
}: OffCanvasDescriptionProps) {
    return (
        <BaseUIDialog.Description
            className={clsx("offcanvas-description", className)}
            {...props}
        >
            {props.children}
        </BaseUIDialog.Description>
    )
}
