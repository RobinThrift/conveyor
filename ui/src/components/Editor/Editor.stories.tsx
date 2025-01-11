import type { Tag } from "@/domain/Tag"
import { Provider } from "@/state"
import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react"
import { generateFullTestContent } from "@testhelper"
import React from "react"
import { Editor } from "./Editor"

import "@/index.css"

const meta: Meta<typeof Editor> = {
    title: "Components/Editor",
    component: Editor,
    decorators: (Story, { globals: { configureMockRootStore } }) => (
        <Provider store={configureMockRootStore()}>
            <Story />
        </Provider>
    ),
}

export default meta
type Story = StoryObj<typeof Editor>

export const Overview: Story = {
    parameters: {
        layout: "fullscreen",
    },
    args: {
        placeholder: "Placeholder text...",
        lazy: false,
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
        <div className="tablet:container mx-auto h-screen tablet:p-8">
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
        <div className="container mx-auto h-screen p-8">
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
        lazy: false,
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
        <div className="container mx-auto h-screen p-8">
            <Editor {...args} />
        </div>
    ),
}
