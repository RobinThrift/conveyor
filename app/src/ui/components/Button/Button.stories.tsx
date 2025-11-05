import type { Meta, StoryObj } from "@storybook/react-vite"
import React, { useRef } from "react"

import { BinIcon, ClipboardIcon, SlidersIcon } from "@/ui/components/Icons"
import "@/ui/styles/index.css"

import { Button } from "./Button"

const meta: Meta<typeof Button> = {
    title: "Components/Button",
    component: Button,
}

export default meta

type Story = StoryObj<typeof Button>

export const Overview: Story = {
    args: {
        className: "elevation-2",
    },
    render: (args) => {
        return (
            <div className="space-y-4 grid place-items-center place-content-center h-[80svh]">
                <div className="flex gap-8">
                    <Button {...args} variant="regular">
                        Regular
                    </Button>
                    <Button {...args} variant="primary">
                        Primary
                    </Button>
                    <Button {...args} variant="danger">
                        Danger
                    </Button>
                </div>

                <h2 className="w-full text-xl font-semibold">Icons</h2>
                <div className="flex items-start gap-8">
                    <Button {...args} iconLeft={<ClipboardIcon />} />
                    <Button {...args} iconLeft={<BinIcon />} />

                    <Button {...args} iconLeft={<SlidersIcon />}>
                        Icon Left
                    </Button>
                    <Button {...args} iconRight={<BinIcon />} variant="primary">
                        Icon Right
                    </Button>
                    <Button
                        {...args}
                        iconRight={<ClipboardIcon />}
                        iconLeft={<SlidersIcon />}
                        variant="danger"
                    >
                        Icon left and right
                    </Button>
                </div>

                <h2 className="w-full text-xl font-semibold">Disabled</h2>
                <div className="flex gap-8">
                    <Button {...args} iconLeft={<ClipboardIcon />} disabled={true} />
                    <Button {...args} iconLeft={<BinIcon />} disabled={true} />
                    <Button {...args} variant="regular" disabled={true}>
                        Regular
                    </Button>
                    <Button {...args} variant="primary" disabled={true}>
                        Primary
                    </Button>
                    <Button {...args} variant="danger" disabled={true}>
                        Danger
                    </Button>
                </div>
            </div>
        )
    },
}

export const Tooltips: Story = {
    args: {
        tooltip: "This is some tooltip content",
    },
    render: (args) => {
        let ref = useRef<HTMLDialogElement | null>(null)

        let onClick = () => {
            ref.current?.showModal()
        }

        return (
            <div className="w-full h-[100svh] flex items-center justify-center gap-20">
                <Button {...args} onClick={onClick}>
                    Button with a tooltip
                </Button>

                <dialog
                    ref={ref}
                    className="max-w-none max-h-none w-screen h-screen open:flex items-center justify-center"
                >
                    <div className="w-fit h-[30svh] items-center justify-center shadow-lg rounded-xl p-12 flex">
                        <Button {...args} variant="primary">
                            Button with a tooltip
                        </Button>
                    </div>
                </dialog>
            </div>
        )
    },
}
