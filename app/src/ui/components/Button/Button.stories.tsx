import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import { ArrowUpRightIcon, BinIcon, PlusIcon, SlidersIcon, UserIcon } from "@/ui/components/Icons"
import "@/ui/styles/index.css"

import { Button } from "./Button"

const meta: Meta<typeof Button> = {
    title: "Components/Button",
    component: Button,
}

export default meta

type Story = StoryObj<typeof Button>

export const Basic: Story = {
    args: {
        children: <>Button Text</>,
    },
}

export const Variants: Story = {
    render: (args) => {
        return (
            <div className="space-y-4">
                <div className="flex gap-4">
                    <Button {...args} variant="regular">
                        Regular
                    </Button>
                    <Button {...args} variant="primary">
                        Primary
                    </Button>
                    <Button {...args} variant="danger">
                        Danger
                    </Button>
                    <Button {...args} variant="success">
                        Success
                    </Button>
                </div>

                <div className="flex gap-4">
                    <Button {...args} variant="regular" outline={true}>
                        Outline Regular
                    </Button>
                    <Button {...args} variant="primary" outline={true}>
                        Outline Primary
                    </Button>
                    <Button {...args} variant="danger" outline={true}>
                        Outline Danger
                    </Button>
                    <Button {...args} variant="success" outline={true}>
                        Outline Success
                    </Button>
                </div>

                <div className="flex gap-4">
                    <Button {...args} variant="regular" plain={true}>
                        Regular (Plain)
                    </Button>
                    <Button {...args} variant="primary" plain={true}>
                        Primary (Plain)
                    </Button>
                    <Button {...args} variant="danger" plain={true}>
                        Danger (Plain)
                    </Button>
                    <Button {...args} variant="success" plain={true}>
                        Success (Plain)
                    </Button>
                </div>
            </div>
        )
    },
}

export const Sizes: Story = {
    render: (args) => {
        return (
            <div className="flex items-start gap-2">
                <Button {...args} size="sm">
                    Small (sm)
                </Button>
                <Button {...args} size="md">
                    Regular (md)
                </Button>
                <Button {...args} size="lg">
                    Large (lg)
                </Button>
            </div>
        )
    },
}

export const Icons: Story = {
    render: (args) => {
        return (
            <div className="space-y-2">
                <h3>Regular</h3>
                <div className="flex items-start gap-2">
                    <Button {...args} iconLeft={<UserIcon />}>
                        Icon Left
                    </Button>
                    <Button {...args} iconRight={<BinIcon />} variant="primary">
                        Icon Right
                    </Button>
                    <Button
                        {...args}
                        iconRight={<PlusIcon />}
                        iconLeft={<SlidersIcon />}
                        variant="danger"
                    >
                        Icon left and right
                    </Button>

                    <Button
                        {...args}
                        iconRight={<PlusIcon />}
                        aria-label="Icon Only"
                        variant="success"
                    />
                </div>

                <h3>Small</h3>
                <div className="flex items-start gap-2">
                    <Button {...args} iconLeft={<UserIcon />} size="sm">
                        Icon Left
                    </Button>
                    <Button {...args} iconRight={<BinIcon />} size="sm">
                        Icon Right
                    </Button>
                    <Button {...args} iconRight={<PlusIcon />} iconLeft={<SlidersIcon />} size="sm">
                        Icon left and right
                    </Button>

                    <Button {...args} iconRight={<PlusIcon />} aria-label="Icon Only" size="sm" />
                </div>

                <h3>Large</h3>
                <div className="flex items-start gap-2">
                    <Button {...args} iconLeft={<UserIcon />} size="lg">
                        Icon Left
                    </Button>
                    <Button {...args} iconRight={<BinIcon />} size="lg">
                        Icon Right
                    </Button>
                    <Button {...args} iconRight={<PlusIcon />} iconLeft={<SlidersIcon />} size="lg">
                        Icon left and right
                    </Button>

                    <Button {...args} iconRight={<PlusIcon />} aria-label="Icon Only" size="lg" />
                </div>

                <h3>Plain</h3>
                <div className="flex items-start gap-2">
                    <Button {...args} iconRight={<BinIcon />} aria-label="Icon Only" plain={true} />
                    <Button
                        {...args}
                        iconRight={<BinIcon />}
                        aria-label="Icon Only"
                        plain={true}
                        variant="primary"
                    />
                    <Button
                        {...args}
                        iconRight={<BinIcon />}
                        aria-label="Icon Only"
                        plain={true}
                        variant="danger"
                    />
                    <Button
                        {...args}
                        iconRight={<BinIcon />}
                        aria-label="Icon Only"
                        plain={true}
                        variant="success"
                    />
                </div>

                <h3>Outline</h3>
                <div className="flex items-start gap-2">
                    <Button
                        {...args}
                        iconRight={<ArrowUpRightIcon />}
                        aria-label="Icon Only"
                        outline
                    >
                        Goto Link
                    </Button>

                    <Button
                        {...args}
                        iconRight={<ArrowUpRightIcon />}
                        aria-label="Icon Only"
                        outline
                        variant="primary"
                    >
                        Goto Link
                    </Button>

                    <Button
                        {...args}
                        iconRight={<ArrowUpRightIcon />}
                        aria-label="Icon Only"
                        outline
                        variant="danger"
                    >
                        Goto Link
                    </Button>

                    <Button
                        {...args}
                        iconRight={<ArrowUpRightIcon />}
                        aria-label="Icon Only"
                        outline
                        variant="success"
                    >
                        Goto Link
                    </Button>
                </div>
            </div>
        )
    },
}

export const States: Story = {
    args: {
        isDisabled: true,
    },
    render: (args) => {
        return (
            <div className="space-y-4">
                <div className="flex gap-4">
                    <Button {...args} variant="regular">
                        Regular
                    </Button>
                    <Button {...args} variant="primary">
                        Primary
                    </Button>
                    <Button {...args} variant="danger">
                        Danger
                    </Button>
                    <Button {...args} variant="success">
                        Success
                    </Button>
                </div>

                <div className="flex gap-4">
                    <Button {...args} variant="regular" outline={true}>
                        Outline Regular
                    </Button>
                    <Button {...args} variant="primary" outline={true}>
                        Outline Primary
                    </Button>
                    <Button {...args} variant="danger" outline={true}>
                        Outline Danger
                    </Button>
                    <Button {...args} variant="success" outline={true}>
                        Outline Success
                    </Button>
                </div>

                <div className="flex gap-4">
                    <Button {...args} variant="regular" plain={true}>
                        Regular (Plain)
                    </Button>
                    <Button {...args} variant="primary" plain={true}>
                        Primary (Plain)
                    </Button>
                    <Button {...args} variant="danger" plain={true}>
                        Danger (Plain)
                    </Button>
                    <Button {...args} variant="success" plain={true}>
                        Success (Plain)
                    </Button>
                </div>
            </div>
        )
    },
}
