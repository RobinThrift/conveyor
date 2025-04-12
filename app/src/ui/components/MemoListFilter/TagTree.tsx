import clsx from "clsx"
import React, { type Key } from "react"
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
import type { TagTreeItem } from "./state"

export interface TagTreeProps {
    className?: string
    tags: Tag[]
    tagTree: TagTreeItem[]
    expandedIDs: string[]
    selected?: string
    onAction: (tag: Key) => void
    onSelectionChange: (selection: Selection) => void
    onExpandedChange: (expanded: Set<Key>) => void
}

export function TagTree({
    className,
    tags,
    tagTree,
    expandedIDs,
    selected,
    onAction,
    onSelectionChange,
    onExpandedChange,
}: TagTreeProps) {
    if (tags.length === 0) {
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
                            <TagTreeItemContent item={item} />
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

const TagTreeItemContent = React.memo(({ item }: { item: TagTreeItem }) => {
    return (
        <TreeItemContent>
            <div className="tag-tree-item-expand-toggle">
                <HashIcon className={"icon"} />
                {item.tag}
                <span className="text-subtle-dark">
                    {item.count ? ` (${item.count})` : null}
                </span>
                {item.children.length ? (
                    <Button
                        slot="chevron"
                        className="tag-tree-item-expand-toggle-btn"
                    >
                        <CaretRightIcon />
                    </Button>
                ) : null}
            </div>
        </TreeItemContent>
    )
})
