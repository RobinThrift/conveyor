import {
    type Key,
    startTransition,
    useCallback,
    useMemo,
    useState,
} from "react"
import type { Selection } from "react-aria-components"

import type { ListMemosQuery } from "@/domain/Memo"
import type { Tag } from "@/domain/Tag"
import type { CalendarDate } from "@/lib/i18n"
import { useStateSet } from "@/ui/hooks/useStateSet"

export type Filter = ListMemosQuery

export function useMemoListFilterState(props: {
    tags: Tag[]
    filter: Filter
    onChangeFilter: (f: Filter) => void
}) {
    let [collapsibileDatePickerExpaned, setCollapsibileDatePickerExpaned] =
        useState(false)

    let onChangeSearch = useCallback(
        (query: string) => {
            props.onChangeFilter({
                ...props.filter,
                query,
            })
        },
        [props.filter, props.onChangeFilter],
    )

    let onSelectDate = useCallback(
        (date: CalendarDate | undefined) => {
            props.onChangeFilter({
                ...props.filter,
                exactDate: date,
            })
        },
        [props.filter, props.onChangeFilter],
    )

    let onSelectStateFilter = useCallback(
        (state?: "isArchived" | "isDeleted") => {
            let { isArchived, isDeleted, ...filter } = props.filter

            switch (state) {
                case "isArchived":
                    props.onChangeFilter({
                        ...filter,
                        isArchived: true,
                    })
                    return
                case "isDeleted":
                    props.onChangeFilter({
                        ...filter,
                        isDeleted: true,
                    })
                    return
            }

            props.onChangeFilter(filter)
        },
        [props.filter, props.onChangeFilter],
    )

    let tagTreeState = useTagTreeState(props)

    return useMemo(
        () => ({
            tagTreeState,
            datepicker: {
                expanded: collapsibileDatePickerExpaned,
                setExpanded: setCollapsibileDatePickerExpaned,
            },
            onChangeSearch,
            onSelectDate,
            onSelectStateFilter,
        }),
        [
            tagTreeState,
            collapsibileDatePickerExpaned,
            onChangeSearch,
            onSelectDate,
            onSelectStateFilter,
        ],
    )
}

export interface TagTreeItem {
    id: string
    tag: string
    count: number
    children: TagTreeItem[]
}

function useTagTreeState({
    tags,
    filter,
    onChangeFilter,
}: { tags: Tag[]; filter: Filter; onChangeFilter: (f: Filter) => void }) {
    let [tagTree, disabledKeys]: [TagTreeItem[], Set<string>] = useMemo(() => {
        let tree: Record<string, TagTreeItem> = {}
        let items: TagTreeItem[] = []
        let disabledKeys = new Set<string>()

        for (let tag of tags) {
            let segments = tag.tag.replace("#", "").split("/")

            let parentID = ""
            for (let segment of segments) {
                let id = parentID === "" ? segment : `${parentID}/${segment}`
                let count = id === tag.tag ? tag.count : 0

                let item: TagTreeItem = {
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
        if (!filter.tag || !tags.find((n) => n.tag === filter.tag)) {
            return manuallyExpanded
        }

        let selectedPath = filter.tag.split("/").reduce((ids, segment) => {
            if (ids.length === 0) {
                ids.push(segment)
            } else {
                ids.push(`${ids.at(-1)}/${segment}`)
            }
            return ids
        }, [] as string[])

        return [...manuallyExpanded, ...selectedPath]
    }, [filter.tag, tags, manuallyExpanded])

    let onAction = useCallback(
        (tag: Key) => {
            if (disabledKeys.has(tag as string)) {
                manuallyExpandedSetter.toggle(tag as string)
                return
            }

            startTransition(() => {
                if (tag === filter.tag) {
                    onChangeFilter({
                        ...filter,
                        tag: undefined,
                    })
                } else {
                    onChangeFilter({
                        ...filter,
                        tag: tag as string,
                    })
                }
            })
        },
        [filter, disabledKeys, onChangeFilter, manuallyExpandedSetter.toggle],
    )

    let onSelectionChange = useCallback(
        (selection: Selection) => {
            if (selection === "all") {
                return
            }
            startTransition(() => {
                let tag = ([...selection][0] as string) ?? ""
                if (disabledKeys.has(tag)) {
                    manuallyExpandedSetter.toggle(tag)
                    return
                }

                if (tag === filter.tag) {
                    onChangeFilter({
                        ...filter,
                        tag: undefined,
                    })
                } else {
                    onChangeFilter({
                        ...filter,
                        tag: tag as string,
                    })
                }
            })
        },
        [filter, disabledKeys, onChangeFilter, manuallyExpandedSetter.toggle],
    )

    let onExpandedChange = useCallback(
        (expanded: Set<Key>) => {
            startTransition(() => {
                manuallyExpandedSetter.set(expanded as Set<string>)
            })
        },
        [manuallyExpandedSetter.set],
    )

    return {
        tagTree,
        expandedIDs,
        selected: filter.tag,
        onAction,
        onSelectionChange,
        onExpandedChange,
    }
}
