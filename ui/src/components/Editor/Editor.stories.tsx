import type { Tag } from "@/domain/Tag"
import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { Editor } from "./Editor"

import "@/index.css"

const meta: Meta<typeof Editor> = {
    title: "Components/Editor",
    component: Editor,
}

export default meta
type Story = StoryObj<typeof Editor>

export const Basic: Story = {
    name: "Editor",
    args: {
        memo: {
            id: "new",
            content: "",
            isArchived: false,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
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
        <div className="container mx-auto">
            <Editor {...args} />
        </div>
    ),
}
