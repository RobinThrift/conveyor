import type { Meta, StoryObj } from "@storybook/react-vite"
import React, { useCallback, useEffect, useState } from "react"
import { useDispatch } from "react-redux"

import type { ListMemosQuery as Filter } from "@/domain/Memo"
import { generateMockMemos } from "@/lib/testhelper/memos"
import { decoratorWithMockData } from "@/lib/testhelper/rootStore"
import { actions } from "@/ui/state"

import "@/ui/styles/index.css"

import { AppHeaderProvider } from "../AppHeader"
import { MemoListFilter } from "./MemoListFilter"

let { tags: mockTags } = generateMockMemos()

const meta: Meta<typeof MemoListFilter> = {
    title: "Components/MemoListFilter",
    component: MemoListFilter,
    args: {
        filter: {},
        tags: mockTags,
    },
    parameters: {
        layout: "fullscreen",
    },
    decorators: [decoratorWithMockData],
}

export default meta
type Story = StoryObj<typeof MemoListFilter>

export const Overview: Story = {
    name: "MemoListFilter",

    render: (args) => {
        let dispatch = useDispatch()
        let [filter, setFilter] = useState<Filter>(args.filter)

        let onChangeFilter = useCallback(
            (filter: Filter) => {
                setFilter(filter)
                args.onChangeFilter(filter)
            },
            [args.onChangeFilter],
        )

        useEffect(() => {
            if (args.filter) {
                setFilter(args.filter)
            }
        }, [args.filter])

        useEffect(() => {
            dispatch(actions.tags.loadTags())
        }, [dispatch])

        return (
            <div className="mx-auto px-1 tablet:px-4 w-full max-w-[400px]">
                <AppHeaderProvider />
                <MemoListFilter {...args} filter={filter} onChangeFilter={onChangeFilter} />
            </div>
        )
    },
}
