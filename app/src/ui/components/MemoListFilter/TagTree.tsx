import clsx from "clsx"
import React, { type Key, useCallback, useMemo } from "react"
import {
    Button,
    Collection,
    type Selection,
    Tree,
    TreeItem,
    TreeItemContent,
} from "react-aria-components"

import type { Tag } from "@/domain/Tag"
import { CaretRightIcon, HashIcon } from "@/ui/components/Icons"
import { useStateSet } from "@/ui/hooks/useStateSet"

export interface TagTreeProps {
    className?: string
    tags: Tag[]
    selected?: string
    onSelect: (selected?: string) => void
}

interface TreeItemT {
    id: string
    tag: string
    count: number
    children: TreeItemT[]
}

export function TagTree({ className, ...props }: TagTreeProps) {
    let {
        tagTree,
        expandedIDs,
        selected,
        onAction,
        onSelectionChange,
        onExpandedChange,
    } = useTagTreeState(props)

    if (props.tags.length === 0) {
        return null
    }

    return (
        <div className={clsx("tag-tree", className)}>
            <Tree
                aria-label="Tag tree"
                selectionMode="single"
                selectionBehavior="toggle"
                items={tagTree}
                expandedKeys={expandedIDs}
                selectedKeys={selected ? [selected] : []}
                onAction={onAction}
                onSelectionChange={onSelectionChange}
                onExpandedChange={onExpandedChange}
            >
                {function renderItem(item) {
                    return (
                        <TreeItem
                            textValue={item.tag}
                            className="tag-tree-item"
                        >
                            <TreeItemContent>
                                {({ hasChildItems }) => (
                                    <div className="tag-tree-item-expand-toggle">
                                        {hasChildItems && (
                                            <Button
                                                slot="chevron"
                                                className="tag-tree-item-expand-toggle-btn"
                                            >
                                                <CaretRightIcon />
                                            </Button>
                                        )}
                                        <HashIcon className={"icon"} />
                                        {item.tag}
                                        <span className="text-subtle-dark">
                                            {item.count
                                                ? ` (${item.count})`
                                                : null}
                                        </span>
                                    </div>
                                )}
                            </TreeItemContent>
                            <Collection items={item.children}>
                                {renderItem}
                            </Collection>
                        </TreeItem>
                    )
                }}
            </Tree>
        </div>
    )
}

function useTagTreeState({
    tags,
    selected,
    onSelect: propagateSelectionChange,
}: TagTreeProps) {
    let [tagTree, disabledKeys]: [TreeItemT[], Set<string>] = useMemo(() => {
        let tree: Record<string, TreeItemT> = {}
        let items: TreeItemT[] = []
        let disabledKeys = new Set<string>()

        for (let tag of tags) {
            let segments = tag.tag.replace("#", "").split("/")

            let parentID = ""
            for (let segment of segments) {
                let id = parentID === "" ? segment : `${parentID}/${segment}`
                let count = id === tag.tag ? tag.count : 0

                let item: TreeItemT = {
                    id: id,
                    tag: segment,
                    count,
                    children: [],
                }

                if (item.count === 0) {
                    disabledKeys.add(id)
                } else {
                    disabledKeys.delete(id)
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
                    if (exists.count !== 0) {
                        disabledKeys.delete(id)
                    }
                } else {
                    parent.children.push(item)
                    tree[id] = item
                }

                parentID = id
            }
        }

        return [items, disabledKeys]
    }, [tags])

    let [manuallyExpanded, manuallyExpandedSetter] = useStateSet<string>([])

    let expandedIDs = useMemo(() => {
        if (!selected || !tags.find((n) => n.tag === selected)) {
            return manuallyExpanded
        }

        let selectedPath = selected.split("/").reduce((ids, segment) => {
            if (ids.length === 0) {
                ids.push(segment)
            } else {
                ids.push(`${ids.at(-1)}/${segment}`)
            }
            return ids
        }, [] as string[])

        return [...manuallyExpanded, ...selectedPath]
    }, [selected, tags, manuallyExpanded])

    let onAction = useCallback(
        (tag: Key) => {
            if (disabledKeys.has(tag as string)) {
                manuallyExpandedSetter.toggle(tag as string)
                return
            }

            if (tag === selected) {
                propagateSelectionChange(undefined)
            } else {
                propagateSelectionChange(tag as string)
            }
        },
        [
            selected,
            disabledKeys,
            propagateSelectionChange,
            manuallyExpandedSetter.toggle,
        ],
    )

    let onSelectionChange = useCallback(
        (selection: Selection) => {
            if (selection === "all") {
                return
            }

            let tag = ([...selection][0] as string) ?? ""
            if (disabledKeys.has(tag)) {
                manuallyExpandedSetter.toggle(tag)
                return
            }

            if (tag === selected) {
                propagateSelectionChange(undefined)
            } else {
                propagateSelectionChange(tag)
            }
        },
        [
            selected,
            disabledKeys,
            propagateSelectionChange,
            manuallyExpandedSetter.toggle,
        ],
    )

    let onExpandedChange = useCallback(
        (expanded: Set<Key>) => {
            manuallyExpandedSetter.add(expanded as Set<string>)
        },
        [manuallyExpandedSetter.add],
    )

    return {
        tagTree,
        expandedIDs,
        selected,
        onAction,
        onSelectionChange,
        onExpandedChange,
    }
}
