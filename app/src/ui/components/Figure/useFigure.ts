import React, { startTransition, useCallback, useRef, useState } from "react"
import { useImageState } from "../Image/useImageState"

export function useFigure(props: {
    src: string
}) {
    let dialogRef = useRef<HTMLDialogElement | null>(null)
    let ref = useRef<HTMLElement | null>(null)
    let zoomedFigRef = useRef<HTMLElement | null>(null)
    let [isZoomed, setIsZoomed] = useState(false)
    let srcRect = useRef<
        | {
              x: number
              y: number
              width: number
              height: number
              borderRadius: string
          }
        | undefined
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
                startTransition(() => {
                    dialogRef.current?.close()
                    dialogRef.current?.style.removeProperty(
                        "--normalized-drag-length",
                    )
                    srcRect.current = undefined
                    setIsZoomed(false)
                })
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
                            borderRadius: `calc(${1 / scaleX} * var(--spacing) * 2)`,
                        },
                    ],
                    {
                        duration: 300,
                        easing: "linear(0, 0.379 5.6%, 0.66 11.7%, 0.855 18.5%, 0.924 22.3%, 0.976 26.4%, 1.01 33%, 1.025 41.1%, 1.005 72.8%, 1)",
                    },
                )

                let imgAnim = imgRef.current?.animate([{ opacity: 1 }], {
                    duration: 200,
                })
                imgAnim?.pause()

                imgAnim?.addEventListener("finish", () => {
                    imgAnim?.cancel()
                })

                anim.addEventListener(
                    "finish",
                    () => {
                        ref.current?.classList.remove("is-zoomed")
                        imgAnim?.play()
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
                borderRadius: ref.current?.style.borderRadius ?? "",
            }

            dialog.addEventListener(
                "close",
                () => {
                    srcRect.current = undefined
                    setIsZoomed(false)
                },
                { once: true, passive: true },
            )

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
    let pointerIDs = useRef<Set<number>>(new Set())
    let reset = useCallback((el: HTMLElement) => {
        let anim = el.animate(
            [{ transform: "translateX(0px) translateY(0px)" }],
            { duration: 200 },
        )
        anim?.addEventListener(
            "finish",
            () => {
                el.style.transform = "translateX(0px) translateY(0px)"
                delete el.dataset.isDragging
            },
            { once: true },
        )
        el.parentElement?.style.removeProperty("--normalized-drag-length")
    }, [])

    let onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            let target = e.target as HTMLElement
            if (target.tagName === "FIGCAPTION") {
                return
            }

            if (!e.isPrimary && pointerIDs.current.size === 0) {
                return
            }

            pointerIDs.current.add(e.pointerId)

            if (pointerIDs.current.size > 1) {
                ;(e.target as HTMLDivElement).releasePointerCapture(e.pointerId)
                pointerIDs.current.clear()
                if (ref.current) {
                    reset(ref.current)
                }
                return
            }

            pointerPos.current = { x: e.clientX, y: e.clientY }
            e.stopPropagation()
            target.setPointerCapture(e.pointerId)

            if (ref.current) {
                ref.current.dataset.isDragging = "true"
                boundingRect.current = ref.current.getBoundingClientRect()
                offset.current = {
                    x: e.nativeEvent.offsetX,
                    y: e.nativeEvent.offsetY,
                }
            }
        },
        [ref.current, reset],
    )

    let onPointerCancel = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (pointerIDs.current.size === 0 || !ref.current) {
                return
            }

            e.stopPropagation()
            ;(e.target as HTMLDivElement).releasePointerCapture(e.pointerId)

            let numPointers = pointerIDs.current.size
            pointerIDs.current.delete(e.pointerId)

            if (numPointers > 1) {
                reset(ref.current)
                return
            }

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
                reset(ref.current)
            }
        },
        [close, reset, ref.current],
    )

    let onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (pointerIDs.current.size > 1) {
                return
            }

            let animRef = ref.current
            if (pointerIDs.current.size !== 1 || !animRef || !e.isPrimary) {
                return
            }
            e.stopPropagation()

            let translateX =
                e.clientX - boundingRect.current.x - offset.current.x
            let translateY =
                e.clientY - boundingRect.current.y - offset.current.y

            let length = Math.sqrt(
                (translateX / boundingRect.current.width) ** 2 +
                    (translateY / boundingRect.current.height) ** 2,
            )
            let scale = 1 - length * 0.3

            animRef.style.transition = "none"
            requestAnimationFrame(() => {
                animRef.parentElement?.style.setProperty(
                    "--normalized-drag-length",
                    length.toFixed(2),
                )
                if (pointerIDs.current.size !== 0) {
                    animRef.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(clamp(0.7, ${scale}, 1.0))`
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
