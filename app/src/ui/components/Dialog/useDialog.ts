import React, {
    useContext,
    useRef,
    useMemo,
    useId,
    useCallback,
    useEffect,
    useState,
    startTransition,
} from "react"

import { type DialogContext, dialogContext } from "./context"

export function useDialog(props: {
    isModal?: boolean
    open?: boolean
    isKeyboardDismissable?: boolean
    autofocus?: boolean
    children: React.ReactNode | React.ReactNode[]
    defaultOpen?: boolean
    onClose?: () => void
}) {
    let ref = useRef<HTMLDialogElement | null>(null)
    let labelledByID = useId()
    let describedByID = useId()
    let incrementNesting = useNesting(ref)
    let [isOpen, setIsOpen] = useState(false)

    let open = useCallback(() => {
        if (isOpen) {
            return
        }

        if (ref.current) {
            ref.current.inert = false
            for (let anim of ref.current.getAnimations()) {
                anim.cancel()
            }
        }

        if (props.isModal) {
            incrementNesting()
            ref.current?.showModal()
        } else {
            ref.current?.show()
        }
        setIsOpen(true)
    }, [props.isModal, isOpen, incrementNesting])

    let close = useCallback(() => {
        if (!isOpen) {
            return
        }

        let dialog = ref.current
        if (!dialog) {
            return
        }

        let closeDialog = () => {
            delete dialog.dataset.state
            dialog.inert = false
            dialog.close()
            setIsOpen(false)
        }

        requestAnimationFrame(() => {
            let animation = dialog.getAnimations().at(0)
            if (animation) {
                animation.finished.then(closeDialog)
            } else {
                closeDialog()
            }
        })

        dialog.dataset.state = "closing"
        dialog.inert = true
    }, [isOpen])

    useEffect(() => {
        if (typeof props.open === "undefined") {
            return
        }

        if (props.open && !ref.current?.open) {
            startTransition(() => {
                open()
            })
            return
        }

        if (!props.open && ref.current?.open) {
            startTransition(() => {
                close()
            })
        }
    }, [props.open, open, close])

    let ctx = useMemo(
        () =>
            ({
                ref,
                isModal: props.isModal,
                isKeyboardDismissable:
                    props.isKeyboardDismissable ?? !props.isModal,
                autofocus: props.autofocus ?? props.isModal,
                isOpen,
                defaultOpen: props.defaultOpen,
                labelledByID,
                describedByID,
                open,
                close,
            }) satisfies DialogContext,
        [
            open,
            close,
            isOpen,
            props.isModal,
            props.isKeyboardDismissable,
            props.autofocus,
            props.defaultOpen,
            labelledByID,
            describedByID,
        ],
    )

    useEffect(() => {
        if (ctx.isKeyboardDismissable) {
            return
        }

        let onkeydown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault()
            }
        }

        ref.current?.addEventListener("keydown", onkeydown)

        return () => {
            ref.current?.removeEventListener("keydown", onkeydown)
        }
    }, [ctx.isKeyboardDismissable])

    useEffect(() => {
        let onclose = props.onClose
        if (!onclose) {
            return
        }

        ref.current?.addEventListener("close", onclose)
        return () => {
            ref.current?.removeEventListener("close", onclose)
        }
    }, [props.onClose])

    return ctx
}

function useNesting(ref: React.RefObject<HTMLDialogElement | null>) {
    let existingCtx = useContext(dialogContext)

    return useCallback(() => {
        if (!existingCtx?.ref.current) {
            return
        }

        let currNested =
            Number.parseInt(
                existingCtx.ref.current.style.getPropertyValue(
                    "--nested-dialogs",
                ) ?? "0",
                10,
            ) || 0

        existingCtx.ref.current.style.setProperty(
            "--nested-dialogs",
            `${currNested + 1}`,
        )

        ref.current?.addEventListener(
            "close",
            () => {
                let currNested =
                    Number.parseInt(
                        existingCtx?.ref.current?.style.getPropertyValue(
                            "--nested-dialogs",
                        ) ?? "0",
                        10,
                    ) || 0

                existingCtx?.ref.current?.style.setProperty(
                    "--nested-dialogs",
                    `${Math.max(currNested - 1, 0)}`,
                )
            },
            { passive: true, once: true },
        )
    }, [existingCtx?.ref.current, ref.current])
}
export function useDialogDragHandle({
    ref,
    ...props
}: {
    ref: React.RefObject<HTMLDialogElement | null>
    onClose?: () => void
}) {
    let startingTopOffset = useRef(0)
    let isDragging = useRef(false)
    let lastPointerY = useRef(-1)
    let velocity = useRef(0)
    let height = useRef(0)
    let durationMs = 250
    let animFrame = useRef<
        ReturnType<typeof requestAnimationFrame> | undefined
    >(undefined)

    let animation = useRef<Animation | undefined>(undefined)

    let updatePos = useCallback(() => {
        if (!animation.current || !isDragging.current) {
            return
        }

        let translateBy = lastPointerY.current - startingTopOffset.current
        let progress = translateBy / Math.max(height.current, 1)
        animation.current.currentTime = progress * durationMs

        animFrame.current = requestAnimationFrame(updatePos)
    }, [durationMs])

    let onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            isDragging.current = true
            lastPointerY.current = e.clientY
            ;(e.target as HTMLDivElement).setPointerCapture(e.pointerId)

            if (!ref.current) {
                return
            }

            if (animFrame.current) {
                cancelAnimationFrame(animFrame.current)
            }

            let rect = ref.current.getBoundingClientRect()
            startingTopOffset.current = rect.top + e.clientY - rect.top
            height.current = rect.height
            animation.current = ref.current.animate(
                [
                    {
                        transform: "translateY(0)",
                        "--backdrop-opacity": "100%",
                    },
                    {
                        transform: `translateY(${rect.height}px)`,
                        "--backdrop-opacity": 0,
                    },
                ],
                { duration: durationMs, fill: "forwards", composite: "add" },
            )
            animation.current.pause()

            animFrame.current = requestAnimationFrame(updatePos)
        },
        [durationMs, ref.current, updatePos],
    )

    let onPointerCancel = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!isDragging.current || !ref.current || !animation.current) {
                return
            }

            if (animFrame.current) {
                cancelAnimationFrame(animFrame.current)
            }

            isDragging.current = false
            ;(e.target as HTMLDivElement).releasePointerCapture(e.pointerId)

            let translateBy = lastPointerY.current - startingTopOffset.current
            let progress = translateBy / Math.max(height.current, 1)
            animation.current.currentTime = progress * durationMs
            if (
                progress > 0.7 ||
                (progress > 0.5 && velocity.current > 0) ||
                velocity.current > 27
            ) {
                animation.current.addEventListener(
                    "finish",
                    () => {
                        animation.current = undefined
                        startingTopOffset.current = 0
                        isDragging.current = false
                        lastPointerY.current = -1
                        velocity.current = 0
                        height.current = 0
                        props.onClose?.()
                    },
                    { once: true },
                )
                animation.current.play()
            } else {
                if (animation.current.currentTime < 0.1) {
                    animation.current.currentTime = 0.1
                }
                animation.current.reverse()
            }
        },
        [props.onClose, ref.current, durationMs],
    )

    let onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!isDragging.current || !ref.current || !animation.current) {
                return
            }

            velocity.current = e.clientY - lastPointerY.current
            lastPointerY.current = e.clientY
        },
        [ref.current],
    )

    return {
        onPointerDown,
        onPointerCancel,
        onPointerMove,
    }
}
