import { useCallback, useMemo, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import type { Tag } from "@/domain/Tag"
import { useStateSet } from "@/ui/hooks/useStateSet"
import { actions, selectors } from "@/ui/state"

export function useTagTree() {
    let dispatch = useDispatch()
    let currentTagFilter = useSelector(selectors.memos.tagFilterValue)
    let tags = useSelector(selectors.tags.tags)

    let tagTree = useMemo(() => tagsToTree(tags), [tags])

    let [expanded, toggleExpandItem] = useExpandedItems({
        tags,
        selectedTag: currentTagFilter,
    })

    let selectedTag = useRef(currentTagFilter)
    selectedTag.current = currentTagFilter

    let selectItem = useCallback(
        (tag: string) => {
            let item = getTagItemByTag(tagTree, tag)
            if (!item) {
                return
            }

            if (!item.count) {
                toggleExpandItem(item.tag)
                return
            }

            if (selectedTag.current === tag) {
                dispatch(actions.memos.setTagFilter({ tag: undefined }))
            } else {
                dispatch(actions.memos.setTagFilter({ tag }))
            }
        },
        [dispatch, tagTree, toggleExpandItem],
    )

    let tagTreeNavigation = useTagTreeNavigation({
        tagTree,
        selectItem,
        toggleExpandItem,
        expanded,
    })

    return {
        tagTree,
        expanded,
        currentTagFilter,
        toggleExpandItem,
        selectItem,
        ...tagTreeNavigation,
    }
}

const navKeyCodes = {
    Enter: "Enter",
    Space: " ",
    PageUp: "PageUp",
    PageDown: "PageDown",
    End: "End",
    Home: "Home",
    ArrowLeft: "ArrowLeft",
    ArrowUp: "ArrowUp",
    ArrowRight: "ArrowRight",
    ArrowDown: "ArrowDown",
}

function useTagTreeNavigation({
    selectItem,
    toggleExpandItem,
    expanded,
    tagTree,
}: {
    selectItem: (tag: string) => void
    toggleExpandItem: (tag: string) => void
    expanded: Set<string>
    tagTree: TagTreeItem[]
}) {
    let [focussed, setFocussed] = useState<string | undefined>(undefined)

    let focusPreviousItem = useCallback(
        (tag: string) => {
            let prevItem = findPreviousItem(tag, tagTree, expanded)
            if (prevItem) {
                setFocussed(prevItem.tag)
                document.getElementById(prevItem.tag)?.focus()
            }
        },
        [tagTree, expanded],
    )

    let focusNextItem = useCallback(
        (tag: string) => {
            let prevItem = findNextItem(tag, tagTree, expanded)
            if (prevItem) {
                setFocussed(prevItem.tag)
                document.getElementById(prevItem.tag)?.focus()
            }
        },
        [tagTree, expanded],
    )

    return {
        focussed,
        onKeyDown: useCallback(
            (e: React.KeyboardEvent) => {
                if (e.altKey || e.ctrlKey || e.metaKey) {
                    return
                }

                let handled = false
                let target = e.target as HTMLElement
                let tag = target.id

                switch (e.key) {
                    case navKeyCodes.Enter:
                    case navKeyCodes.Space:
                        selectItem(tag)
                        handled = true
                        break

                    case navKeyCodes.ArrowUp:
                        focusPreviousItem(tag)
                        handled = true
                        break

                    case navKeyCodes.ArrowDown:
                        focusNextItem(tag)
                        handled = true
                        break

                    case navKeyCodes.ArrowRight:
                        if (
                            target.attributes.getNamedItem("aria-expanded")
                                ?.value !== "true"
                        ) {
                            toggleExpandItem(tag)
                        } else {
                            focusNextItem(tag)
                        }

                        handled = true
                        break

                    case navKeyCodes.ArrowLeft:
                        if (
                            target.attributes.getNamedItem("aria-expanded")
                                ?.value === "true"
                        ) {
                            toggleExpandItem(tag)
                        } else {
                            // setFocusToParentItem(tag);
                        }
                        handled = true
                        break

                    case navKeyCodes.Home:
                        // setFocusToFirstItem();
                        handled = true
                        break

                    case navKeyCodes.End:
                        // setFocusToLastItem();
                        handled = true
                        break
                }

                if (handled) {
                    e.stopPropagation()
                    e.preventDefault()
                }
            },
            [selectItem, toggleExpandItem, focusPreviousItem, focusNextItem],
        ),
        onFocus: useCallback((e: React.FocusEvent) => {
            setFocussed(e.target.id)
        }, []),
    }
}

export interface TagTreeItem {
    tag: string
    segment: string
    count: number
    children: TagTreeItem[]
    index: number
}

function tagsToTree(tags: Tag[]) {
    let tree: Record<string, TagTreeItem> = {}
    let items: TagTreeItem[] = []

    for (let tag of tags) {
        let segments = tag.tag.replace("#", "").split("/")

        let parentID = ""
        for (let segment of segments) {
            let id = parentID === "" ? segment : `${parentID}/${segment}`
            let count = id === tag.tag ? tag.count : 0

            let item: TagTreeItem = {
                tag: id,
                segment,
                count,
                children: [],
                index: items.length,
            }

            let parent = tree[parentID]

            if (!parent) {
                if (!tree[id]) {
                    tree[id] = item
                    items.push(item)
                }
                parentID = id
                continue
            }

            let exists = tree[id]
            if (exists) {
                exists.count = Math.max(exists.count, count)
            } else {
                item.index = parent.children.length
                parent.children.push(item)
                parent.count = parent.count + item.count
                tree[id] = item
            }

            parentID = id
        }
    }

    return items.filter((item) => sumTreeItemCount(item) !== 0)
}

function sumTreeItemCount(item: TagTreeItem): number {
    if (item.count !== 0) {
        return item.count
    }

    return item.children.reduce(
        (sum, child) => sum + sumTreeItemCount(child),
        0,
    )
}

function useExpandedItems({
    selectedTag,
    tags,
}: { tags: Tag[]; selectedTag?: string }) {
    let [manuallyExpanded, manuallyExpandedSetter] = useStateSet<string>([])

    let expanded = useMemo(() => {
        if (!selectedTag || !tags.find((n) => n.tag === selectedTag)) {
            return new Set(manuallyExpanded)
        }

        let selectedPath = selectedTag.split("/").reduce((ids, segment) => {
            if (ids.length === 0) {
                ids.push(segment)
            } else {
                ids.push(`${ids.at(-1)}/${segment}`)
            }
            return ids
        }, [] as string[])

        return new Set([...manuallyExpanded, ...selectedPath])
    }, [tags, selectedTag, manuallyExpanded])

    let toggleExpandItem = useCallback(
        (tag: string) => {
            manuallyExpandedSetter.toggle(tag)
        },
        [manuallyExpandedSetter.toggle],
    )

    return [expanded, toggleExpandItem] as [
        typeof expanded,
        typeof toggleExpandItem,
    ]
}

function findPreviousItem(
    tag: string,
    tagTree: TagTreeItem[],
    expanded: Set<string>,
) {
    let segments = tag.split("/")

    let prev: TagTreeItem | undefined
    let subtree = tagTree

    for (let i = 0; i < segments.length; i++) {
        let segment = segments[i]
        let found = false
        for (let item of subtree) {
            if (item.segment === segment) {
                if (i < segments.length - 1) {
                    prev = item
                    subtree = item.children
                }
                found = true
                break
            }
            prev = item
        }

        if (!found) {
            break
        }
    }

    if (!prev) {
        return
    }

    return prev.children.some((c) => c.tag === tag)
        ? prev
        : findLastItem(prev, expanded)
}

function findNextItem(
    tag: string,
    tagTree: TagTreeItem[],
    expanded: Set<string>,
) {
    let next: TagTreeItem | undefined

    let hierachy = getSubtreeForTag(tagTree, tag)

    for (let i = hierachy.length - 1; i >= 0; i--) {
        let item = hierachy.at(i)
        if (!item) {
            break
        }

        if (expanded.has(item.tag) && i === hierachy.length - 1) {
            next = item.children.at(0)
        }

        if (next) {
            break
        }

        let parent = i > 0 ? hierachy.at(i - 1) : undefined
        if (parent) {
            next = parent.children.at(item.index + 1)
        }

        if (next) {
            break
        }
    }

    if (next) {
        return next
    }

    let first = hierachy.at(0)
    if (!first) {
        return
    }

    return tagTree.at(first.index + 1)
}

function findLastItem(item: TagTreeItem, expanded: Set<string>) {
    if (!expanded.has(item.tag)) {
        return item
    }

    let last = item.children.at(-1)
    if (last && expanded.has(last.tag)) {
        return findLastItem(last, expanded)
    }

    return last ?? item
}

function getSubtreeForTag(tagTree: TagTreeItem[], tag: string): TagTreeItem[] {
    let segments = tag.split("/")
    let subtree: TagTreeItem[] = []
    let tree = tagTree

    for (let segment of segments) {
        for (let item of tree) {
            if (item.segment === segment) {
                subtree.push(item)
                tree = item.children
            }
        }
    }

    return subtree
}

function getTagItemByTag(tagTree: TagTreeItem[], tag: string) {
    let segments = tag.split("/")
    let tree = tagTree
    let found: TagTreeItem | undefined

    for (let segment of segments) {
        for (let item of tree) {
            if (item.segment === segment) {
                found = item
                tree = item.children
            }
        }
    }

    return found
}
