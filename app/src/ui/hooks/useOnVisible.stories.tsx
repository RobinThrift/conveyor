import type { Meta, StoryObj } from "@storybook/react"
import React, { useRef } from "react"

import "@/ui/styles/index.css"

import clsx from "clsx"
import { useOnVisible } from "./useOnVisible"

const meta: Meta<{ ratio: number }> = {
    title: "hooks/useOnVisible",
}

export default meta
type Story = StoryObj<{ ratio: number }>

export const Overview: Story = {
    name: "useOnVisible",

    args: { ratio: 0.1 },

    render: (args) => {
        return (
            <article className="w-full flex flex-col items-center space-y-2">
                <div className="h-[500px] w-[400px] bg-subtle" />
                <IsVisible {...args} />
                <div className="h-[500px] w-[400px] bg-subtle" />
                <IsVisible {...args} />
                <div className="h-[500px] w-[400px] bg-subtle" />
                <IsVisible {...args} />
                <div className="h-[500px] w-[400px] bg-subtle" />
                <IsVisible {...args} />
                <div className="h-[500px] w-[400px] bg-subtle" />
                <IsVisible {...args} />
                <div className="h-[500px] w-[400px] bg-subtle" />
                <IsVisible {...args} />
            </article>
        )
    },
}

function IsVisible(props: { ratio: number }) {
    let ref = useRef<HTMLDivElement | null>(null)
    let isVisible = useOnVisible(ref, { ...props })
    return (
        <div
            ref={ref}
            className={clsx(
                "font-semibold text-lg h-[2lh] w-full flex items-center justify-center",
                {
                    "text-success": isVisible,
                    "text-danger": !isVisible,
                },
            )}
        >
            {isVisible.toString()}
        </div>
    )
}
