import { useStore } from "@tanstack/react-store"
import clsx from "clsx"
import React, { startTransition, useCallback, useId, useMemo, useState } from "react"

import type { MemoID } from "@/domain/Memo"
import { NotePencilIcon, XIcon } from "@/ui/components/Icons"
import { useFormat } from "@/ui/i18n"
import { getScrollOffsetTop } from "@/ui/navigation"
import { actions, selectors, stores } from "@/ui/stores"

export const memoListTabID = "memo-list"

export function TabList() {
    let {
        isAllMemosTabActive,
        tabListItems,
        focussed,
        onFocus,
        onKeyDown,
        setSelectedItem,
        closeTab,
    } = useTabList()
    let titleID = useId()

    return (
        <nav
            aria-labelledby={titleID}
            className={clsx("memo-list-sidebar-tab-list", { "sr-only": tabListItems.length < 1 })}
        >
            <div
                className="memo-list-sidebar-tab-list-items"
                role="tablist"
                aria-orientation="vertical"
                aria-label="Memo Tabs"
                onFocus={onFocus}
                onKeyDown={onKeyDown}
            >
                <div className="memo-list-sidebar-tab-list-item memo-list-sidebar-tab-list-item-all-memos">
                    <button
                        className="memo-list-sidebar-tab-list-item-activate-btn"
                        type="button"
                        role="tab"
                        id={`tab-${memoListTabID}`}
                        aria-selected={isAllMemosTabActive}
                        aria-controls={`#tab-panel-${memoListTabID}`}
                        data-memo-id={memoListTabID}
                        tabIndex={focussed === memoListTabID ? 0 : -1}
                        onClick={setSelectedItem(memoListTabID)}
                    >
                        <NotePencilIcon />
                        <span>All Memos</span>
                    </button>
                </div>
                {tabListItems.map((item) => (
                    <TabListItem
                        key={item.id}
                        memoID={item.id}
                        isActive={item.isActive}
                        isFocussed={focussed === item.id}
                        setSelectedItem={setSelectedItem}
                        closeTab={closeTab}
                    />
                ))}
            </div>
        </nav>
    )
}

function TabListItem({
    memoID,
    isActive,
    isFocussed,
    setSelectedItem,
    closeTab,
}: {
    memoID: MemoID
    isActive: boolean
    isFocussed: boolean
    setSelectedItem: (memoID: string) => () => void
    closeTab: (memoID: string) => () => void
}) {
    let memo = useStore(stores.memos.memos, selectors.memos.get(memoID))
    let isEditing = useStore(stores.memos.memos, selectors.memos.isEditing(memoID))
    let { formatDateTime } = useFormat()
    let title = useMemo(
        () =>
            extractTitle(memo.content) ??
            formatDateTime(memo.createdAt, { dateStyle: "long", timeStyle: "short" }),
        [memo.content, memo.createdAt, formatDateTime],
    )

    return (
        <div className={clsx("memo-list-sidebar-tab-list-item", { "is-editing": isEditing })}>
            <button
                id={`tab-${memoID}`}
                className="memo-list-sidebar-tab-list-item-activate-btn"
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`#tab-panel-${memoID}`}
                data-memo-id={memoID}
                tabIndex={isFocussed ? 0 : -1}
                onClick={setSelectedItem(memoID)}
                onAuxClick={closeTab(memoID)}
            >
                <span>{title}</span>
            </button>
            <button
                id={`close-tab-btn-${memoID}`}
                className="memo-list-sidebar-tab-list-item-close-btn"
                type="button"
                onFocus={(e) => {
                    e.target.blur()
                }}
                onClick={closeTab(memoID)}
                aria-hidden={true}
                tabIndex={-1}
            >
                <XIcon />
            </button>
        </div>
    )
}

type TabListItem = {
    id: MemoID
    isActive: boolean
}

function useTabList() {
    let openMemos = useStore(stores.ui.openMemos)
    let activeMemos = useStore(stores.ui.activeMemos)

    let tabListItems: TabListItem[] = []

    for (let memoID of openMemos) {
        tabListItems.push({ id: memoID, isActive: activeMemos.includes(memoID) })
    }

    let [focussed, setFocussed] = useState<string | undefined>(memoListTabID)

    let focusPreviousItem = useCallback(
        (memoID: string) => {
            if (memoID === memoListTabID) {
                return
            }

            let index = openMemos.indexOf(memoID)
            if (index === -1) {
                return
            }

            if (index === 0) {
                setFocussed(memoListTabID)
                document.getElementById(`tab-${memoListTabID}`)?.focus()
                return
            }

            let prevID = openMemos[index - 1]
            if (!prevID) {
                return
            }

            setFocussed(prevID)
            document.getElementById(`tab-${prevID}`)?.focus()
        },
        [openMemos],
    )

    let focusNextItem = useCallback(
        (memoID: string) => {
            if (memoID === memoListTabID && openMemos.length > 0) {
                let nextID = openMemos[0]
                setFocussed(nextID)
                document.getElementById(`tab-${nextID}`)?.focus()
                return
            }

            let index = openMemos.indexOf(memoID)
            if (index === -1) {
                return
            }
            let nextID = openMemos[index + 1]

            setFocussed(nextID)
            document.getElementById(`tab-${nextID}`)?.focus()
        },
        [openMemos],
    )

    return {
        isAllMemosTabActive: activeMemos.length === 0,
        tabListItems,
        focussed,
        onKeyDown: useCallback(
            (e: React.KeyboardEvent) => {
                if (e.altKey || e.ctrlKey || e.metaKey) {
                    return
                }

                if (openMemos.length === 0) {
                    return
                }

                let handled = false
                let target = e.target as HTMLElement
                let memoID = target.dataset.memoId
                if (!memoID) {
                    return
                }

                switch (e.code) {
                    case "Enter":
                    case "Space":
                        if (memoID === memoListTabID) {
                            actions.ui.deactivateAllMemos(getScrollOffsetTop())
                        } else {
                            actions.ui.activateMemo(memoID, getScrollOffsetTop())
                        }
                        handled = true
                        break

                    case "ArrowUp":
                        focusPreviousItem(memoID)
                        handled = true
                        break

                    case "ArrowDown":
                        focusNextItem(memoID)
                        handled = true
                        break

                    case "Home":
                        setFocussed(memoListTabID)
                        handled = true
                        break

                    case "End":
                        setFocussed(openMemos[openMemos.length - 1])
                        handled = true
                        break

                    case "Backspace":
                    case "Delete":
                        focusPreviousItem(memoID)
                        actions.ui.closeMemo(memoID)
                        handled = true
                        break
                }

                if (handled) {
                    e.stopPropagation()
                    e.preventDefault()
                }
            },
            [openMemos, focusPreviousItem, focusNextItem],
        ),
        onFocus: useCallback((e: React.FocusEvent) => {
            setFocussed((e.target as HTMLElement).dataset.memoId)
        }, []),
        setSelectedItem: useCallback(
            (memoID: string) => () => {
                startTransition(() => {
                    setFocussed(memoID)

                    if (memoID === memoListTabID) {
                        actions.ui.deactivateAllMemos(getScrollOffsetTop())
                    } else {
                        actions.ui.activateMemo(memoID, getScrollOffsetTop())
                    }
                })
            },
            [],
        ),
        closeTab: useCallback(
            (memoID: string) => () => {
                requestAnimationFrame(() => {
                    actions.ui.closeMemo(memoID)
                })
            },
            [],
        ),
    }
}

let titleRegexp = /^#\s+.*/
function extractTitle(content: string): string | undefined {
    let match = titleRegexp.exec(content.trimStart())
    return match?.[0]?.substring(2)
}
