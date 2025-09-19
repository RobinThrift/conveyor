import { useCallback, useRef, useState } from "react"

export function useRadioGroup({
    defaultValue,
    onValueChange,
}: {
    defaultValue?: string
    onValueChange?: (value: string) => void
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
                    setSelectedItem(id)
                    handled = true
                    break

                case navKeyCodes.ArrowUp: {
                    let next = findPrevItem(root, focussed)
                    if (!next) {
                        break
                    }
                    next.focus()
                    setFocussed(next.id)
                    setSelectedItem(next.id)
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
                    setSelectedItem(next.id)
                    handled = true
                    break
                }
            }

            if (handled) {
                e.stopPropagation()
                e.preventDefault()
            }
        },
        [focussed],
    )

    let onFocus = useCallback((e: React.FocusEvent) => {
        setFocussed(e.target.id)
    }, [])

    let onChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setSelectedItem(e.target.id)
            onValueChange?.(e.target.value)
        },
        [onValueChange],
    )

    return {
        ref,
        selected,
        focussed,
        onKeyDown,
        onFocus,
        onChange,
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
    let items = root.querySelectorAll("label.radio-item input")

    if (!currentID) {
        return Array.from(items)[0] as HTMLElement
    }

    let currIndex = Array.from(items).findIndex((e) => e.id === currentID)
    if (currIndex === -1) {
        return
    }

    if (currIndex === 0) {
        return items[items.length - 1] as HTMLElement
    }

    return items[currIndex - 1] as HTMLElement
}

function findNextItem(root: HTMLElement, currentID?: string): HTMLElement | undefined {
    let items = root.querySelectorAll("label.radio-item input")

    if (!currentID) {
        return Array.from(items)[0] as HTMLElement
    }

    let currIndex = Array.from(items).findIndex((e) => e.id === currentID)
    if (currIndex === -1) {
        return
    }

    if (currIndex === items.length - 1) {
        return items[0] as HTMLElement
    }

    return items[currIndex + 1] as HTMLElement
}
