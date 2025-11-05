import { useCallback, useId, useMemo, useRef, useState } from "react"

import type { DropdownMenuContext, DropdownMenuItem } from "./context"

export function useDropdownMenu({
    preventFocusOnPress = false,
}: {
    preventFocusOnPress?: boolean
}): DropdownMenuContext {
    let targetID = useId()
    let labelledByID = useId()
    let popover = useRef<HTMLDivElement | null>(null)
    let [isOpen, setIsOpen] = useState(false)
    let [focussedIndex, setFocussedIndex] = useState<number>(0)
    let [items, setItems] = useState<DropdownMenuItem[]>([])
    let preventFocus = useRef(false)

    let open = useCallback((src?: HTMLElement) => {
        if (!popover.current) {
            return
        }

        // @ts-expect-error: in newer api version
        popover.current.showPopover({ source: src })

        setIsOpen(true)
    }, [])

    let close = useCallback(() => {
        setIsOpen(false)
        popover.current?.hidePopover()
    }, [])

    let onBeforeToggle = useCallback((e: React.ToggleEvent<HTMLDivElement>) => {
        if (e.nativeEvent.newState === "open") {
            setIsOpen(true)

            if (!preventFocus.current) {
                requestAnimationFrame(() => {
                    ;(
                        (e.nativeEvent.target as HTMLElement)?.querySelector(
                            "[role=menu]",
                        ) as HTMLElement
                    )?.focus()
                })
            } else {
                preventFocus.current = false
            }
        } else {
            setIsOpen(false)
            setFocussedIndex(0)
        }
    }, [])

    let focusFirstItem = useCallback(() => {
        let index = items.findIndex((i) => !i.isDisabled)
        if (index !== -1) {
            setFocussedIndex(0)
        }
    }, [items])

    let focusLastItem = useCallback(() => {
        let index = items.findLastIndex((i) => !i.isDisabled)
        if (index !== -1) {
            setFocussedIndex(items.length - 1)
        }
    }, [items])

    let focusNextItem = useCallback(() => {
        let next = -1

        let start = focussedIndex + 1
        if (start > items.length - 1) {
            start = 0
        }

        for (let i = start; i < items.length; i++) {
            if (i === focussedIndex) {
                return
            }

            if (!items[i].isDisabled) {
                next = i
                break
            }

            if (i === items.length - 1) {
                i = -1
            }
        }

        if (next === -1) {
            return
        }

        setFocussedIndex(next)
    }, [items, focussedIndex])

    let focusPrevItem = useCallback(() => {
        let next = -1

        let start = focussedIndex - 1
        if (start < 0) {
            start = items.length - 1
        }

        for (let i = start; i >= 0; i--) {
            if (i === focussedIndex) {
                return
            }

            if (!items[i].isDisabled) {
                next = i
                break
            }

            if (i === 0) {
                i = items.length
            }
        }

        if (next === -1) {
            return
        }

        setFocussedIndex(next)
    }, [items, focussedIndex])

    let onMouseEnterItem = useCallback(
        (e: React.MouseEvent<HTMLElement>) => {
            let target = e.target as HTMLElement
            if (!target.id) {
                target = target.closest("[role=menuitem]") ?? target
            }
            let itemIndex = items.findIndex((i) => i.id === target.id) ?? 0
            setFocussedIndex(Math.max(itemIndex, 0))
        },
        [items],
    )

    let activateFocussed = useCallback(() => {
        document.getElementById(items[focussedIndex].id)?.click()
    }, [items, focussedIndex])

    return {
        targetID,
        labelledByID,
        popover,
        isOpen,
        open,
        close,
        focussed: useMemo(() => items[focussedIndex], [items, focussedIndex])?.id ?? "",
        focusFirstItem,
        focusLastItem,
        focusNextItem,
        focusPrevItem,
        items,
        setItems,
        onBeforeToggle,
        onMouseEnterItem,
        activateFocussed,

        preventFocusOnPress,
        preventFocus,
    }
}
