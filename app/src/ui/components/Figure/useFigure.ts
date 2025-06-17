import React, { useCallback, useRef, useState } from "react"
import { useImageState } from "../Image/useImageState"

export function useFigure(props: {
    src: string
}) {
    let dialogRef = useRef<HTMLDialogElement | null>(null)
    let ref = useRef<HTMLElement | null>(null)
    let zoomedFigRef = useRef<HTMLElement | null>(null)
    let [isZoomed, setIsZoomed] = useState(false)
    let srcRect = useRef<
        { x: number; y: number; width: number; height: number } | undefined
    >(undefined)

    let imgRef = useRef<HTMLImageElement | null>(null)
    let img = useImageState({ ref: imgRef, src: props.src })

    let close = useCallback(
        (fromRect?: {
            x: number
            y: number
            width: number
            height: number
        }) => {
            let reset = () => {
                dialogRef.current?.close()
                srcRect.current = undefined
                setIsZoomed(false)
            }

            let figureRef = zoomedFigRef.current
            let toRect = srcRect.current
            if (figureRef && toRect && fromRect) {
                let scaleX = toRect.width / fromRect.width
                let scaleY = toRect.height / fromRect.height
                let widthDiff = fromRect.width - toRect.width
                let heightDiff = fromRect.height - toRect.height

                let translateX = toRect.x - fromRect.x - widthDiff / 2
                let translateY = toRect.y - fromRect.y - heightDiff / 2

                let anim = figureRef.animate(
                    [
                        {
                            transform: `translateX(${translateX}px) translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
                        },
                    ],
                    { duration: 200 },
                )

                let imgAnim = imgRef.current?.animate([{ opacity: 1 }], {
                    duration: 1,
                    delay: 199,
                    fill: "forwards",
                })

                imgAnim?.addEventListener("finish", () => {
                    ref.current?.classList.remove("is-zoomed")
                    imgAnim?.cancel()
                })

                anim.addEventListener(
                    "finish",
                    () => {
                        reset()
                    },
                    { once: true },
                )
            } else {
                reset()
            }
        },
        [],
    )

    let onClickZoom = useCallback(
        (e: React.PointerEvent<HTMLButtonElement>) => {
            let dialog = dialogRef.current
            if (!dialog) {
                return
            }

            if (ref.current) {
                ref.current.style.viewTransitionName = "figure-zoomed"
            }
            setIsZoomed(true)

            let rect = e.currentTarget.getBoundingClientRect()
            srcRect.current = {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
            }

            dialog.addEventListener("close", () => {
                srcRect.current = undefined
                setIsZoomed(false)
            })

            document.startViewTransition(() => {
                if (ref.current) {
                    ref.current.style.viewTransitionName = ""
                }
                dialog.showModal()
            })
        },
        [],
    )

    return {
        ref,
        dialogRef,
        zoomedFigRef,
        imgRef,
        isZoomed,
        close,
        onClickZoom,
        img,
    }
}

export function useDraggableFigure({
    ref,
    close,
}: {
    close: (fromRect?: {
        x: number
        y: number
        width: number
        height: number
    }) => void
    ref: React.RefObject<HTMLElement | null>
}) {
    let offset = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
    let boundingRect = useRef<DOMRect>(
        ref.current?.getBoundingClientRect() ?? new DOMRect(),
    )
    let pointerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
    let isDragging = useRef(false)

    let onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            let target = e.target as HTMLElement
            if (target.tagName === "FIGCAPTION") {
                return
            }

            e.stopPropagation()
            target.setPointerCapture(e.pointerId)
            isDragging.current = true
            pointerPos.current = { x: e.clientX, y: e.clientY }

            if (ref.current) {
                ref.current.dataset.isDragging = "true"
                boundingRect.current = ref.current.getBoundingClientRect()
                offset.current = {
                    x: e.clientX - boundingRect.current.x,
                    y: e.clientY - boundingRect.current.y,
                }
            }
        },
        [ref.current],
    )

    let onPointerCancel = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!isDragging.current || !ref.current) {
                return
            }
            e.stopPropagation()
            ;(e.target as HTMLDivElement).releasePointerCapture(e.pointerId)

            isDragging.current = false

            let translateX =
                e.clientX - boundingRect.current.x - offset.current.x
            let translateY =
                e.clientY - boundingRect.current.y - offset.current.y

            if (
                Math.abs(translateX) > boundingRect.current.width / 4 ||
                Math.abs(translateY) > boundingRect.current.height / 4
            ) {
                ref.current.dataset.isClosing = "true"
                close(boundingRect.current)
            } else {
                let anim = ref.current.animate(
                    [{ transform: "translateX(0px) translateY(0px)" }],
                    { duration: 200 },
                )
                anim.addEventListener(
                    "finish",
                    () => {
                        if (ref.current) {
                            ref.current.style.transform =
                                "translateX(0px) translateY(0px)"
                            delete ref.current.dataset.isDragging
                        }
                    },
                    { once: true },
                )
            }
        },
        [close, ref.current],
    )

    let onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            let animRef = ref.current
            if (!isDragging.current || !animRef) {
                return
            }
            e.stopPropagation()

            let translateX =
                e.clientX - boundingRect.current.x - offset.current.x
            let translateY =
                e.clientY - boundingRect.current.y - offset.current.y

            animRef.style.transition = "none"
            requestAnimationFrame(() => {
                if (isDragging.current) {
                    animRef.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`
                }
            })

            pointerPos.current.x = e.clientX
            pointerPos.current.y = e.clientY
        },
        [ref.current],
    )

    let onDragStart = useCallback((e: React.DragEvent) => {
        e.preventDefault()
    }, [])

    let onClickClose = useCallback(() => {
        if (ref.current) {
            ref.current.dataset.isClosing = "true"
        }
        close(ref.current?.getBoundingClientRect())
    }, [close, ref.current])

    return {
        onPointerDown,
        onPointerCancel,
        onPointerMove,
        onDragStart,
        onClickClose,
    }
}
