import React, {
    Activity,
    startTransition,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react"

import { HashIcon, NotePencilIcon, XIcon } from "@/ui/components/Icons"
import { SearchBar } from "@/ui/components/MemoListFilter/Searchbar"
import { TagTreeFilter } from "@/ui/components/MemoListFilter/TagTreeFilter"
import { usePreventScroll } from "@/ui/hooks/usePreventScroll"
import { useT } from "@/ui/i18n"
import { getScrollOffsetTop } from "@/ui/navigation"
import { actions } from "@/ui/stores"

export function TabBar() {
    return (
        <div className="mobile-tabbar">
            <SidebarOffcanvasOverflow />

            <SearchBar className="mobile-tabbar-search-bar" />

            <NewMemoButton />
        </div>
    )
}

function NewMemoButton() {
    let t = useT("components/TabBar")

    let onClick = useCallback(() => {
        let memo = actions.memos.new()
        actions.ui.openMemo(memo.id, getScrollOffsetTop())
    }, [])

    return (
        <button type="button" className="mobile-tabbar-new-memo-btn" onClick={onClick}>
            <NotePencilIcon aria-hidden="true" />
            <span className="sr-only">{t.NewMemo}</span>
        </button>
    )
}

function SidebarOffcanvasOverflow() {
    let t = useT("components/TabBar")
    let { targetID, ref, isOpen, dragRef, closeOffCanvas } = useSidebarOffcanvasOverflow()

    return (
        <div className="mobile-tabbar-tag-filter-overflow-wrapper">
            <button
                type="button"
                className="mobile-tabbar-tag-filter-overflow-trigger"
                popoverTargetAction="toggle"
                popoverTarget={targetID}
            >
                <HashIcon aria-hidden="true" />
                <span className="sr-only">{t.OpenOffcanvasOverflow}</span>
            </button>

            <div ref={ref} id={targetID} popover="auto" className="tag-tree-offcanvas">
                <Activity mode={isOpen ? "visible" : "hidden"}>
                    <div className="tag-tree-offcanvas-header">
                        <button
                            type="button"
                            className="tag-tree-offcanvas-close-btn btn icon-only"
                            onClick={closeOffCanvas}
                        >
                            <XIcon aria-hidden="true" />
                            <span className="sr-only">{t.CloseOverflow}</span>
                        </button>
                    </div>

                    <TagTreeFilter />
                </Activity>
                <div className="tag-tree-offcanvas-drag-handle" ref={dragRef} />
            </div>
        </div>
    )
}

function useSidebarOffcanvasOverflow() {
    let [isOpen, setIsOpen] = useState(false)

    usePreventScroll({ isDisabled: !isOpen })

    let ref = useRef<HTMLDivElement | null>(null)
    let dragRef = useRef<HTMLDivElement | null>(null)
    let targetID = useId()

    let [isClosing, setIsClosing] = useMemo(
        () => [
            () => ref.current?.dataset.isClosing === "true",
            (isClosing: boolean) => {
                if (ref.current) {
                    ref.current.dataset.isClosing = isClosing.toString()
                }
            },
        ],
        [],
    )

    let closeOffCanvas = useCallback(() => {
        if (isOpen) {
            setIsClosing(true)
        }
    }, [isOpen, setIsClosing])

    useEffect(() => {
        let el = ref.current
        if (!el) {
            return
        }

        let onAnimationEnd = () => {
            if (isClosing()) {
                Promise.all(el.getAnimations().map((a) => a.finished)).finally(() => {
                    startTransition(() => {
                        setIsClosing(false)
                        setIsOpen(false)
                    })
                    requestAnimationFrame(() => {
                        el.hidePopover()
                    })
                })
            }
        }

        let onBeforeToggle = (e: Event) => {
            setIsOpen((e as ToggleEvent).newState === "open")

            for (let anim of (e.target as HTMLElement).getAnimations()) {
                if (!(anim instanceof CSSTransition)) {
                    anim.cancel()
                }
            }
        }

        el.addEventListener("beforetoggle", onBeforeToggle)
        el.addEventListener("animationend", onAnimationEnd)
        el.addEventListener("transitionend", onAnimationEnd)

        return () => {
            el.removeEventListener("beforetoggle", onBeforeToggle)
            el.removeEventListener("animationend", onAnimationEnd)
            el.removeEventListener("transitionend", onAnimationEnd)
        }
    })

    useEffect(() => {
        if (!dragRef.current) {
            return
        }

        let startingOffsetX = 0
        let isDragging = false
        let lastPointerX = -1
        let velocity = 0
        let width = 0
        let durationMs = 250
        let animFrame: ReturnType<typeof requestAnimationFrame> | undefined
        let animation: Animation | undefined

        let updatePos = () => {
            if (!animation || !isDragging) {
                return
            }

            let translateBy = lastPointerX - startingOffsetX
            let progress = translateBy / Math.max(width, 1)
            animation.currentTime = progress * durationMs

            animFrame = requestAnimationFrame(updatePos)
        }

        let onPointerDown = (e: PointerEvent) => {
            isDragging = true
            lastPointerX = e.clientX
            ;(e.target as HTMLDivElement).setPointerCapture(e.pointerId)

            if (!ref.current) {
                return
            }

            if (animFrame) {
                cancelAnimationFrame(animFrame)
            }

            let rect = ref.current.getBoundingClientRect()
            startingOffsetX = e.clientX
            width = rect.width
            animation = ref.current.animate(
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
            animation.pause()

            animFrame = requestAnimationFrame(updatePos)
        }

        let onPointerCancel = (e: PointerEvent) => {
            if (!isDragging || !ref.current || !animation) {
                return
            }

            if (animFrame) {
                cancelAnimationFrame(animFrame)
            }

            isDragging = false
            ;(e.target as HTMLDivElement).releasePointerCapture(e.pointerId)

            let translateBy = lastPointerX - startingOffsetX
            let progress = translateBy / Math.max(width, 1)
            animation.currentTime = progress * durationMs

            if (progress > 0.7 || (progress > 0.5 && velocity > 0) || velocity > 27) {
                setIsClosing(true)
                animation.addEventListener(
                    "finish",
                    () => {
                        animation = undefined
                        startingOffsetX = 0
                        isDragging = false
                        lastPointerX = -1
                        velocity = 0
                        width = 0
                    },
                    { once: true },
                )
                animation.play()
            } else {
                if (animation.currentTime < 0.1) {
                    animation.currentTime = 0.1
                }
                animation.reverse()
            }
        }

        let onPointerMove = (e: PointerEvent) => {
            if (!isDragging || !ref.current || !animation) {
                return
            }

            velocity = e.clientX - lastPointerX
            lastPointerX = e.clientX
        }

        dragRef.current?.addEventListener("pointerdown", onPointerDown)
        dragRef.current?.addEventListener("pointermove", onPointerMove)
        dragRef.current?.addEventListener("pointerup", onPointerCancel)
        dragRef.current?.addEventListener("pointercancel", onPointerCancel)

        return () => {
            dragRef.current?.removeEventListener("pointerdown", onPointerDown)
            dragRef.current?.removeEventListener("pointermove", onPointerMove)
            dragRef.current?.removeEventListener("pointerup", onPointerCancel)
            dragRef.current?.removeEventListener("pointercancel", onPointerCancel)
        }
    }, [setIsClosing])

    return {
        targetID,
        ref,
        isOpen,
        dragRef,
        closeOffCanvas,
    }
}
