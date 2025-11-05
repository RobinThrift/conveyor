import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import "@/ui/styles/index.css"

import { SearchBar } from "./Searchbar"

const meta: Meta<typeof SearchBar> = {
    title: "Components/MemoListFilter/SearchBar",
    component: SearchBar,
    parameters: {
        layout: "fullscreen",
    },
}

export default meta
type Story = StoryObj<typeof SearchBar>

export const Overview: Story = {
    name: "SearchBar",

    render: (args) => {
        return (
            <div className="w-full h-[100svh] flex items-center justify-center gap-20">
                <div className="p-1 rounded-lg bg-surface-level-1 border border-surface-border w-[300px]">
                    <SearchBar {...args} />
                </div>
            </div>
        )
    },
}
