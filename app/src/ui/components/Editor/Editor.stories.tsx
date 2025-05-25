import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import type { Tag } from "@/domain/Tag"
import { generateFullTestContent } from "@/lib/testhelper/memos"
import "@/ui/styles/index.css"

import { Editor } from "./Editor"

const meta: Meta<typeof Editor> = {
    title: "Components/Editor",
    component: Editor,

    args: {
        transferAttachment: () => {
            let { resolve, reject, promise } = Promise.withResolvers<void>()
            let r = Math.random() * 5000 + 1000
            setTimeout(() => {
                if (Math.random() > 0.8) {
                    reject()
                    return
                }
                resolve(undefined)
            }, r)
            return promise
        },
    },
}

export default meta
type Story = StoryObj<typeof Editor>

export const Overview: Story = {
    parameters: {
        layout: "fullscreen",
    },
    args: {
        placeholder: "Placeholder text...",
        memo: {
            id: "new",
            content: "",
            isArchived: false,
            isDeleted: false,
            createdAt: faker.date.recent(),
            updatedAt: faker.date.recent(),
        },
        tags: (() => {
            let tags: Tag[] = []

            for (let i = 0; i < 100; i++) {
                tags.push({
                    tag: `#${faker.word.noun()}/${faker.word.noun()}`,
                    count: 0,
                })
            }

            tags.sort()
            return tags
        })(),
    },
    render: (args) => (
        <div className="tablet:container mx-auto min-h-screen tablet:p-8 tablet:max-w-[80rem]">
            <Editor {...args} />
        </div>
    ),
}

export const Placeholder: Story = {
    parameters: {
        layout: "fullscreen",
    },
    args: {
        placeholder: "Placeholder text...",
        memo: {
            id: "new",
            content: "",
            isArchived: false,
            isDeleted: false,
            createdAt: faker.date.recent(),
            updatedAt: faker.date.recent(),
        },
        tags: (() => {
            let tags: Tag[] = []

            for (let i = 0; i < 100; i++) {
                tags.push({
                    tag: `#${faker.word.noun()}/${faker.word.noun()}`,
                    count: 0,
                })
            }

            tags.sort()
            return tags
        })(),
    },
    render: (args) => (
        <div className="tablet:container mx-auto min-h-screen tablet:p-8 tablet:max-w-[80rem]">
            <Editor {...args} />
        </div>
    ),
}

export const WithContent: Story = {
    parameters: {
        layout: "fullscreen",
    },
    args: {
        placeholder: "Placeholder text...",
        className: "h-full",
        memo: {
            id: "1235219",
            content: generateFullTestContent(),
            isArchived: false,
            isDeleted: false,
            createdAt: faker.date.recent(),
            updatedAt: faker.date.recent(),
        },
        tags: (() => {
            let tags: Tag[] = []

            for (let i = 0; i < 100; i++) {
                tags.push({
                    tag: `#${faker.word.noun()}/${faker.word.noun()}`,
                    count: 0,
                })
            }

            tags.sort()
            return tags
        })(),
    },
    render: (args) => (
        <div className="tablet:container mx-auto min-h-[100dvh] tablet:p-8 tablet:max-w-[80rem]">
            <Editor {...args} />
        </div>
    ),
}
