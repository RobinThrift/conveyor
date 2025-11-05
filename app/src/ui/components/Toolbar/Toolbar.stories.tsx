/** biome-ignore-all lint/correctness/useUniqueElementIds: this is just a story */
import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"
import { action } from "storybook/actions"

import "@/ui/styles/index.css"

import {
    ClipboardIcon,
    CodeIcon,
    CopyIcon,
    LinkIcon,
    TextBolderIcon,
    TextItalicIcon,
} from "@/ui/components/Icons"

import { Toolbar, ToolbarButton, ToolbarButtonGroup, ToolbarSeparator } from "./Toolbar"

const meta: Meta<typeof Toolbar> = {
    title: "Components/Toolbar",
    component: Toolbar,
}

export default meta

type Story = StoryObj<typeof Toolbar>

export const Overview: Story = {
    name: "Toolbar",
    args: {
        label: "Storybook Toolbar",
        children: [
            <ToolbarButtonGroup key="formatting" label="Formatting">
                <ToolbarButton label="Bold" action={action("bold")} icon={<TextBolderIcon />} />
                <ToolbarButton label="Italic" action={action("italic")} icon={<TextItalicIcon />} />
                <ToolbarButton label="Monospace" action={action("monospace")} icon={<CodeIcon />} />
                <ToolbarButton
                    label="Insert LInk"
                    action={action("insert-link")}
                    icon={<LinkIcon />}
                />
            </ToolbarButtonGroup>,

            <ToolbarSeparator key="separator-0" />,

            <ToolbarButtonGroup key="copy" label="Copying">
                <ToolbarButton label="Copy" action={action("copy")} icon={<CopyIcon />} />
                <ToolbarButton label="Paste" action={action("paste")} icon={<ClipboardIcon />} />
            </ToolbarButtonGroup>,
        ],
    },

    render: (args) => {
        return (
            <div className="flex flex-col items-center justify-center w-full min-h-[500px]">
                <Toolbar {...args} />
            </div>
        )
    },
}

export const Overflow: Story = {
    name: "Overflow",
    args: {
        label: "Storybook Overflow Toolbar",
        className: "shadow border border-surface-border max-w-lg",
        children: [
            <ToolbarButtonGroup key="formatting-0" label="Formatting">
                <ToolbarButton label="Bold" action={action("bold")} icon={<TextBolderIcon />} />
                <ToolbarButton label="Italic" action={action("italic")} icon={<TextItalicIcon />} />
                <ToolbarButton label="Monospace" action={action("monospace")} icon={<CodeIcon />} />
                <ToolbarButton
                    label="Insert LInk"
                    action={action("insert-link")}
                    icon={<LinkIcon />}
                />
            </ToolbarButtonGroup>,

            <ToolbarSeparator key="separator-0" />,

            <ToolbarButtonGroup key="copy-0" label="Copying">
                <ToolbarButton label="Copy" action={action("copy")} icon={<CopyIcon />} />
                <ToolbarButton label="Paste" action={action("paste")} icon={<ClipboardIcon />} />
            </ToolbarButtonGroup>,

            <ToolbarSeparator key="separator-1" />,

            <ToolbarButtonGroup key="formatting-1" label="Formatting">
                <ToolbarButton label="Bold" action={action("bold")} icon={<TextBolderIcon />} />
                <ToolbarButton label="Italic" action={action("italic")} icon={<TextItalicIcon />} />
                <ToolbarButton label="Monospace" action={action("monospace")} icon={<CodeIcon />} />
                <ToolbarButton
                    label="Insert LInk"
                    action={action("insert-link")}
                    icon={<LinkIcon />}
                />
            </ToolbarButtonGroup>,

            <ToolbarSeparator key="separator-2" />,

            <ToolbarButtonGroup key="copy-1" label="Copying">
                <ToolbarButton label="Copy" action={action("copy")} icon={<CopyIcon />} />
                <ToolbarButton label="Paste" action={action("paste")} icon={<ClipboardIcon />} />
            </ToolbarButtonGroup>,

            <ToolbarSeparator key="separator-3" />,

            <ToolbarButtonGroup key="formatting-2" label="Formatting">
                <ToolbarButton label="Bold" action={action("bold")} icon={<TextBolderIcon />} />
                <ToolbarButton label="Italic" action={action("italic")} icon={<TextItalicIcon />} />
                <ToolbarButton label="Monospace" action={action("monospace")} icon={<CodeIcon />} />
                <ToolbarButton
                    label="Insert LInk"
                    action={action("insert-link")}
                    icon={<LinkIcon />}
                />
            </ToolbarButtonGroup>,

            <ToolbarSeparator key="separator-4" />,

            <ToolbarButtonGroup key="copy-2" label="Copying">
                <ToolbarButton label="Copy" action={action("copy")} icon={<CopyIcon />} />
                <ToolbarButton label="Paste" action={action("paste")} icon={<ClipboardIcon />} />
            </ToolbarButtonGroup>,
        ],
    },

    render: (args) => {
        return (
            <div className="flex flex-col items-center justify-center w-full min-h-[500px]">
                <Toolbar {...args} />
            </div>
        )
    },
}
