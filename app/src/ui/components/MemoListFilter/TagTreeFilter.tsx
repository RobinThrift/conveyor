import { Store, useStore } from "@tanstack/react-store"
import clsx from "clsx"
import React, { useEffect, useRef, useCallback } from "react"

import { useIsMobile } from "@/ui/hooks/useIsMobile"
import { usePreventScroll } from "@/ui/hooks/usePreventScroll"
import { useT } from "@/ui/i18n"
import { Button } from "../Button"
import { XIcon } from "../Icons"
import { TagTree } from "./TagTree"

export function TagTreeFilter(props: { className?: string }) {
    let t = useT("components/MemoListFilter/TagTreeFilter")
    let isOffCanvas = useIsMobile()
    let { isOffCanvasOpen, isOffCanvasClosing, closeOffCanvas } = useTagTreeFilterStore()
    let closeBtn = useRef<HTMLButtonElement | null>(null)

    usePreventScroll({ isDisabled: !isOffCanvas || !isOffCanvasOpen })

    let ref = useRef<HTMLDivElement | null>(null)

    let { onPointerDown, onPointerCancel, onPointerMove } = useOffCanvasDragging({
        ref,
        close: closeOffCanvas,
    })

    useEffect(() => {
        if (isOffCanvas && isOffCanvasOpen && closeBtn.current) {
            if (ref.current) {
                for (let anim of ref.current.getAnimations()) {
                    if (!(anim instanceof CSSTransition)) {
                        anim.cancel()
                    }
                }
            }
            closeBtn.current.focus()
        }
    }, [isOffCanvas, isOffCanvasOpen])

    useEffect(() => {
        if (!isOffCanvasClosing) {
            return
        }

        let cb = () => {
            markOffCanvasClosed()
        }

        let hasAnimation = false
        let hasTransition = false

        if (!ref.current) {
            cb()
            return
        }

        for (let anim of ref.current.getAnimations()) {
            hasAnimation =
                hasAnimation || (anim instanceof Animation && anim.playState === "running")
            hasTransition =
                hasTransition || (anim instanceof CSSTransition && anim.playState === "running")
        }

        if (!hasAnimation && !hasTransition) {
            cb()
            return
        }

        if (hasAnimation) {
            ref.current?.addEventListener("animationend", cb, {
                once: true,
                passive: true,
            })
        }

        if (hasTransition) {
            ref.current?.addEventListener("transitionend", cb, {
                once: true,
                passive: true,
            })
        }

        return () => {
            ref.current?.removeEventListener("animationend", cb)
            ref.current?.removeEventListener("transitionend", cb)
        }
    })

    return (
        <>
            {isOffCanvas && isOffCanvasOpen && (
                /* biome-ignore lint/a11y/useKeyWithClickEvents: this is not supposed to be focused and just simpler than the whole "click outside" thing. I am lazy. */
                <div
                    aria-hidden="true"
                    className="tag-tree-filter-sidebar-overlay"
                    data-is-open={isOffCanvasOpen}
                    data-is-closing={isOffCanvasClosing}
                    onClick={closeOffCanvas}
                />
            )}

            {(!isOffCanvas || (isOffCanvas && isOffCanvasOpen)) && (
                <div
                    ref={ref}
                    role={isOffCanvas ? "dialog" : undefined}
                    aria-hidden={isOffCanvas && !isOffCanvasOpen}
                    aria-modal={isOffCanvas}
                    tabIndex={isOffCanvas ? -1 : undefined}
                    aria-label={t.Title}
                    data-is-closing={isOffCanvasClosing}
                    data-is-open={isOffCanvasOpen}
                    className={clsx(
                        "tag-tree-filter",
                        {
                            "is-offcanvas": isOffCanvas,
                        },
                        props.className,
                    )}
                >
                    {isOffCanvas && (
                        <div className="flex items-center justify-end pe-1">
                            <Button
                                ref={closeBtn}
                                className="tag-tree-filter-sidebar-close-btn"
                                iconRight={<XIcon aria-hidden />}
                                ariaLabel={t.CloseBtn}
                                size="lg"
                                plain
                                onPress={closeOffCanvas}
                            />
                        </div>
                    )}

                    <TagTree />

                    {isOffCanvas && isOffCanvasOpen && (
                        <div
                            className="tag-tree-filter-sidebar-drag-handle"
                            onPointerDown={onPointerDown}
                            onPointerUp={onPointerCancel}
                            onPointerMove={onPointerMove}
                            onPointerCancel={onPointerCancel}
                        />
                    )}
                </div>
            )}
        </>
    )
}

const tagTreeFilterStore = new Store({
    isOffCanvasOpen: false,
    isOffCanvasClosing: false,
})

const markOffCanvasClosed = () =>
    tagTreeFilterStore.setState(() => ({
        isOffCanvasOpen: false,
        isOffCanvasClosing: false,
    }))

const openOffCanvas = () =>
    tagTreeFilterStore.setState(() => ({
        isOffCanvasClosing: false,
        isOffCanvasOpen: true,
    }))
const closeOffCanvas = () =>
    tagTreeFilterStore.setState(() => ({
        isOffCanvasClosing: true,
        isOffCanvasOpen: true,
    }))

export function useTagTreeFilterStore() {
    let store = useStore(tagTreeFilterStore)
    return {
        ...store,
        openOffCanvas,
        closeOffCanvas,
    }
}

function useOffCanvasDragging({
    ref,
    close,
}: { ref: React.RefObject<HTMLDivElement | null>; close: () => void }) {
    let startingOffsetX = useRef(0)
    let isDragging = useRef(false)
    let lastPointerX = useRef(-1)
    let velocity = useRef(0)
    let width = useRef(0)
    let durationMs = 250
    let animFrame = useRef<ReturnType<typeof requestAnimationFrame> | undefined>(undefined)

    let animation = useRef<Animation | undefined>(undefined)

    let updatePos = useCallback(() => {
        if (!animation.current || !isDragging.current) {
            return
        }

        let translateBy = lastPointerX.current - startingOffsetX.current
        let progress = translateBy / Math.max(width.current, 1)
        animation.current.currentTime = progress * durationMs

        animFrame.current = requestAnimationFrame(updatePos)
    }, [durationMs])

    let onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            isDragging.current = true
            lastPointerX.current = e.clientX
            ;(e.target as HTMLDivElement).setPointerCapture(e.pointerId)

            if (!ref.current) {
                return
            }

            if (animFrame.current) {
                cancelAnimationFrame(animFrame.current)
            }

            let rect = ref.current.getBoundingClientRect()
            startingOffsetX.current = e.nativeEvent.offsetX
            width.current = rect.width
            animation.current = ref.current.animate(
                [
                    {
                        transform: "translateX(0)",
                        "--backdrop-opacity": "100%",
                    },
                    {
                        transform: `translateX(${rect.width}px)`,
                        "--backdrop-opacity": 0,
                    },
                ],
                { duration: durationMs, fill: "forwards" },
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

            let translateBy = lastPointerX.current - startingOffsetX.current
            let progress = translateBy / Math.max(width.current, 1)
            animation.current.currentTime = progress * durationMs

            if (
                progress > 0.7 ||
                (progress > 0.5 && velocity.current > 0) ||
                velocity.current > 27
            ) {
                ref.current.dataset.isClosing = "true"
                animation.current.addEventListener(
                    "finish",
                    () => {
                        animation.current = undefined
                        startingOffsetX.current = 0
                        isDragging.current = false
                        lastPointerX.current = -1
                        velocity.current = 0
                        width.current = 0
                        close()
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
        [close, ref.current, durationMs],
    )

    let onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!isDragging.current || !ref.current || !animation.current) {
                return
            }

            velocity.current = e.clientX - lastPointerX.current
            lastPointerX.current = e.clientX
        },
        [ref.current],
    )

    return {
        onPointerDown,
        onPointerCancel,
        onPointerMove,
    }
}
