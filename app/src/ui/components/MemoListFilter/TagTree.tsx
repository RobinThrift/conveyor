import clsx from "clsx"
import React, { useId } from "react"

import { CaretRightIcon, HashIcon } from "@/ui/components/Icons"
import { useT } from "@/ui/i18n"
import { type TagTreeItem as TagTreeItemT, useTagTree } from "./useTagTree"

export interface TagTreeProps {
    className?: string
}

export function TagTree({ className }: TagTreeProps) {
    let t = useT("components/MemoListFilter/TagTree")
    let {
        tagTree,
        currentTagFilter,
        expanded,
        toggleExpandItem,
        selectItem,
        onFocus,
        onKeyDown,
        focussed,
    } = useTagTree()
    let firstTag = tagTree.at(0)?.segment

    return (
        <ul
            className={clsx("tag-tree", className)}
            // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: weird false positive
            role="tree"
            aria-label={t.Label}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
        >
            {tagTree.map((item) => {
                let expandedChildren = expanded.has(item.tag)
                    ? expanded
                          .values()
                          .filter((e) => e.startsWith(item.tag))
                          .toArray()
                    : undefined

                return (
                    <TagTreeItem
                        item={item}
                        key={item.tag}
                        level={1}
                        expanded={expandedChildren}
                        selected={
                            currentTagFilter?.startsWith(item.tag) ? currentTagFilter : undefined
                        }
                        focussed={
                            (focussed ?? firstTag)?.startsWith(item.tag)
                                ? (focussed ?? firstTag)
                                : undefined
                        }
                        toggleExpandItem={toggleExpandItem}
                        selectItem={selectItem}
                    />
                )
            })}
        </ul>
    )
}

type TagTreeItemProps = {
    item: TagTreeItemT
    level: number
    expanded?: string[]
    selected?: string
    focussed?: string
    toggleExpandItem: (tag: string) => void
    selectItem: (tag: string) => void
}

const TagTreeItem = React.memo(
    ({
        item,
        level,
        selected,
        expanded,
        toggleExpandItem,
        focussed,
        selectItem,
    }: TagTreeItemProps) => {
        let t = useT("components/MemoListFilter/TagTree")
        let labeledByID = useId()
        let isExpanded = expanded && expanded?.length > 0 && item.children.length > 0

        return (
            <li
                role="treeitem"
                className="tag-tree-item"
                id={item.tag}
                aria-level={level}
                aria-labelledby={labeledByID}
                aria-expanded={isExpanded}
                aria-selected={selected === item.tag}
                tabIndex={focussed === item.tag ? 0 : -1}
                aria-current={focussed === item.tag}
            >
                <div className="tag-tree-item-content">
                    <HashIcon className={"icon"} aria-hidden />
                    {/* biome-ignore lint/a11y/useKeyWithClickEvents: key pressis handled at a higher level */}
                    {/** biome-ignore lint/a11y/noStaticElementInteractions: false positive */}
                    <span id={labeledByID} onClick={() => selectItem(item.tag)}>
                        {item.segment}
                        {item.count ? (
                            <span className="tag-tree-item-count">
                                <span className="sr-only">{t.Count}</span>
                                {item.count}
                            </span>
                        ) : null}
                    </span>
                    {item.children.length ? (
                        <div
                            aria-hidden={true}
                            className="tag-tree-item-expand-toggle-btn"
                            onClick={() => toggleExpandItem(item.tag)}
                        >
                            <CaretRightIcon />
                        </div>
                    ) : null}
                </div>

                {isExpanded ? (
                    // biome-ignore lint/a11y/useSemanticElements: this is the recommended pattern as per https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
                    <ul className="tag-tree-item-children" role="group" aria-label={item.segment}>
                        {item.children.map((c) => (
                            <TagTreeItem
                                item={c}
                                key={c.tag}
                                level={level + 1}
                                expanded={expanded?.filter((e) => e.startsWith(c.tag))}
                                selected={selected?.startsWith(c.tag) ? selected : undefined}
                                focussed={focussed?.startsWith(c.tag) ? focussed : undefined}
                                toggleExpandItem={toggleExpandItem}
                                selectItem={selectItem}
                            />
                        ))}
                    </ul>
                ) : null}
            </li>
        )
    },
)
