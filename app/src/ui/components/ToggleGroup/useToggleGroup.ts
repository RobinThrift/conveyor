import { useCallback, useEffect, useRef, useState } from "react"

export function useToggleGroup({
    defaultValue,
    onValueChange,
}: {
    defaultValue?: string
    onValueChange?: (value?: string) => void
}) {
    let ref = useRef<HTMLDivElement | null>(null)
    const [focussed, setFocussed] = useState<string | undefined>(undefined)
    const [selected, setSelectedItem] = useState<string | undefined>(defaultValue)

    let onKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            let root = ref.current
            if (!root) {
                return
            }

            if (e.altKey || e.ctrlKey || e.metaKey) {
                return
            }

            let handled = false
            let target = e.target as HTMLElement
            let id = target.id

            switch (e.key) {
                case navKeyCodes.Enter:
                case navKeyCodes.Space:
                    if (selected === id) {
                        setSelectedItem(undefined)
                        onValueChange?.(undefined)
                    } else {
                        setSelectedItem(id)
                        onValueChange?.(id)
                    }
                    handled = true
                    break

                case navKeyCodes.ArrowLeft:
                case navKeyCodes.ArrowUp: {
                    let next = findPrevItem(root, focussed)
                    if (!next) {
                        break
                    }
                    next.focus()
                    setFocussed(next.id)
                    handled = true
                    break
                }

                case navKeyCodes.ArrowRight:
                case navKeyCodes.ArrowDown: {
                    let next = findNextItem(root, focussed)
                    if (!next) {
                        break
                    }
                    next.focus()
                    setFocussed(next.id)
                    handled = true
                    break
                }
            }

            if (handled) {
                e.stopPropagation()
                e.preventDefault()
            }
        },
        [focussed, selected, onValueChange],
    )

    let onFocus = useCallback((e: React.FocusEvent) => {
        setFocussed(e.target.id)
    }, [])

    let setValue = useCallback(
        (value?: string) => {
            setSelectedItem(value)
            setFocussed(value)
            onValueChange?.(value)
        },
        [onValueChange],
    )

    useEffect(() => {
        if (!ref.current || focussed) {
            return
        }

        let first = ref.current.querySelector(".toggle-button")
        setFocussed(first?.id)
    }, [focussed])

    return {
        ref,
        selected,
        focussed,
        onKeyDown,
        onFocus,
        setValue,
    }
}

const navKeyCodes = {
    Enter: "Enter",
    Space: " ",
    ArrowLeft: "ArrowLeft",
    ArrowUp: "ArrowUp",
    ArrowRight: "ArrowRight",
    ArrowDown: "ArrowDown",
}

function findPrevItem(root: HTMLElement, currentID?: string): HTMLElement | undefined {
    let items = root.querySelectorAll(".toggle-button")

    if (!currentID) {
        return Array.from(items)[0] as HTMLElement
    }

    let currIndex = Array.from(items).findIndex((e) => e.id === currentID)
    if (currIndex === -1 || currIndex === 0) {
        return
    }

    return items[currIndex - 1] as HTMLElement
}

function findNextItem(root: HTMLElement, currentSelection?: string): HTMLElement | undefined {
    let items = root.querySelectorAll(".toggle-button")

    if (!currentSelection) {
        return Array.from(items)[0] as HTMLElement
    }

    let currIndex = Array.from(items).findIndex((e) => e.id === currentSelection)
    if (currIndex === -1 || currIndex === items.length - 1) {
        return
    }

    return items[currIndex + 1] as HTMLElement
}
