import clsx from "clsx"
import React, { useCallback, useRef } from "react"
import {
    Dialog as AriaDialog,
    type DialogProps as AriaDialogProps,
    DialogTrigger as AriaDialogTrigger,
    type DialogTriggerProps as AriaDialogTriggerProps,
    Heading as AriaHeading,
    type HeadingProps as AriaHeadingProps,
    Modal as AriaModal,
    ModalOverlay as AriaModalOverlay,
} from "react-aria-components"

export interface OffCanvasProps extends AriaDialogTriggerProps {}

export function OffCanvas(props: OffCanvasProps) {
    return <AriaDialogTrigger {...props} />
}

OffCanvas.Content = OffCanvasContent
OffCanvas.Title = OffCanvasTitle

export type OffCanvasContentProps = AriaDialogProps & {
    isDismissable?: boolean
    isKeyboardDismissDisabled?: boolean
}

export function OffCanvasContent({
    className,
    isDismissable,
    isKeyboardDismissDisabled,
    ...props
}: OffCanvasContentProps) {
    let animRef = useRef<HTMLDivElement | null>(null)
    let isDragging = useRef(false)
    let lastPointerX = useRef(-1)
    let velocity = useRef(0)
    let closeFn = useRef<(() => void) | undefined>(undefined)

    let onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        isDragging.current = true
        lastPointerX.current = e.clientX
        ;(e.target as HTMLDivElement).setPointerCapture(e.pointerId)

        if (animRef.current) {
            animRef.current.style.transition = "none"
        }
    }, [])

    let onPointerCancel = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!isDragging.current || !animRef.current) {
                return
            }

            isDragging.current = false
            ;(e.target as HTMLDivElement).releasePointerCapture(e.pointerId)

            let boundingRect = animRef.current.getBoundingClientRect()
            let translateBy = Math.min(e.clientX - boundingRect.width, 0)

            if (
                (Math.abs(translateBy) > boundingRect.width * 0.5 &&
                    velocity.current < 0) ||
                velocity.current < -27
            ) {
                closeFn.current?.()
            } else {
                animRef.current.style.transition = "transform 250ms"
                animRef.current.style.transform = "translateX(0px)"
                animRef.current.style.animationDuration = "200ms"
            }
        },
        [],
    )

    let onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging.current || !animRef.current) {
            return
        }

        velocity.current = e.clientX - lastPointerX.current
        lastPointerX.current = e.clientX

        let boundingRect = animRef.current.getBoundingClientRect()
        let translateBy = Math.min(e.clientX - boundingRect.width, 0)

        animRef.current.style.transform = `translateX(${translateBy}px)`
        animRef.current.style.animationDuration = "0"
    }, [])

    return (
        <AriaModalOverlay
            className="offcanvas-modal-overlay"
            isDismissable={isDismissable ?? true}
            isKeyboardDismissDisabled={isKeyboardDismissDisabled ?? false}
        >
            <AriaModal className="offcanvas-modal" ref={animRef}>
                <AriaDialog className={clsx("offcanvas", className)} {...props}>
                    {({ close }) => {
                        closeFn.current = close
                        return <>{props.children as React.ReactNode}</>
                    }}
                </AriaDialog>
                <div
                    className="offcanvas-drag-handle"
                    onPointerDown={onPointerDown}
                    onPointerUp={onPointerCancel}
                    onPointerMove={onPointerMove}
                    onPointerCancel={onPointerCancel}
                />
            </AriaModal>
        </AriaModalOverlay>
    )
}

export type OffCanvasTitleProps = AriaHeadingProps

export function OffCanvasTitle({ className, ...props }: OffCanvasTitleProps) {
    return (
        <AriaHeading className={clsx("offcanvas-title", className)} {...props}>
            {props.children}
        </AriaHeading>
    )
}
