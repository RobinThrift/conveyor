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

import { CheckIcon, HashIcon, NotePencilIcon } from "@/ui/components/Icons"
import { SearchBar } from "@/ui/components/MemoListFilter/Searchbar"
import { TagTreeFilter } from "@/ui/components/MemoListFilter/TagTreeFilter"
import { OverFlowMask } from "@/ui/components/OverflowMask"
import { usePreventScroll } from "@/ui/hooks/usePreventScroll"
import { useT } from "@/ui/i18n"
import { getScrollOffsetTop } from "@/ui/navigation"
import { actions } from "@/ui/stores"

export function TabBar() {
    return (
        <>
            <OverFlowMask className="mobile-tabbar-overflow-mask" />

            <div className="mobile-tabbar">
                <SidebarOffcanvasOverflow />

                <SearchBar className="mobile-tabbar-search-bar" />

                <NewMemoButton />
            </div>
        </>
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
    let { targetID, ref, isOpen, closeOffCanvas } = useSidebarOffcanvasOverflow()

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
                            className="tag-tree-offcanvas-close-btn btn icon-only primary"
                            onClick={closeOffCanvas}
                        >
                            <CheckIcon aria-hidden="true" className="icon" />
                            <span className="sr-only">{t.CloseOverflow}</span>
                        </button>
                    </div>

                    <TagTreeFilter />
                </Activity>
            </div>
        </div>
    )
}

function useSidebarOffcanvasOverflow() {
    let [isOpen, setIsOpen] = useState(false)

    usePreventScroll({ isDisabled: !isOpen })

    let ref = useRef<HTMLDivElement | null>(null)
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
                        requestAnimationFrame(() => {
                            el.hidePopover()
                        })
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

    return {
        targetID,
        ref,
        isOpen,
        closeOffCanvas,
    }
}
