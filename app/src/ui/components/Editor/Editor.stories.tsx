import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import type { Tag } from "@/domain/Tag"
import { calendarDateTimeFromDate } from "@/lib/i18n"
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
        memo: {
            id: "new",
            content: "",
            isArchived: false,
            isDeleted: false,
            createdAt: calendarDateTimeFromDate(faker.date.recent()),
            updatedAt: calendarDateTimeFromDate(faker.date.recent()),
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
        <div className="memo-tab-panel-memo">
            <Editor {...args} />
        </div>
    ),
}

export const WithContent: Story = {
    parameters: {
        layout: "fullscreen",
    },
    args: {
        className: "h-full",
        vimModeEnabled: true,
        memo: {
            id: "1235219",
            content: generateFullTestContent(),
            isArchived: false,
            isDeleted: false,
            createdAt: calendarDateTimeFromDate(faker.date.recent()),
            updatedAt: calendarDateTimeFromDate(faker.date.recent()),
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
        <div className="memo-tab-panel-memo">
            <Editor {...args} />
        </div>
    ),
}
