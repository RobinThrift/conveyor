import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import type { Attachment } from "@/domain/Attachment"
import { Second } from "@/lib/duration"
import { type AsyncResult, Ok } from "@/lib/result"
import { delay } from "@/lib/testhelper/delay"
import { generateTitle } from "@/lib/testhelper/memos"
import { AttachmentProvider } from "@/ui/attachments"

import "@/ui/styles/index.css"

import { LinkPreview } from "./LinkPreview"

const meta: Meta<typeof LinkPreview> = {
    title: "Components/LinkPreview",
    component: LinkPreview,
    decorators: [
        (Story) => (
            <div className="content @container">
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof LinkPreview>

export const Overview: Story = {
    args: {
        children: faker.internet.url(),
        img: faker.image.url({ width: 1200, height: 600 }),
        title: generateTitle(),
        description: faker.lorem.sentences({ min: 1, max: 3 }),
    },
}

export const WithAttachmentImage: Story = {
    args: {
        children: faker.internet.url(),
        img: "attachment://yLAy-2K3mImfADHe9exZr?thumbhash=GhgWJIJ/dYiaiIhnh4f5d/qGhg==",
        title: generateTitle(),
        description: faker.lorem.sentences({ min: 1, max: 3 }),
    },

    decorators: (Story) => (
        <AttachmentProvider
            value={{
                getAttachmentDataByID: async (): AsyncResult<{
                    attachment: Attachment
                    data: ArrayBufferLike
                }> => {
                    let res = await fetch(
                        "https://images.unsplash.com/photo-1740393148421-2159bf9e8d8e?q=80&w=6132&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    )

                    await delay(5 * Second)

                    return Ok({
                        attachment: {} as Attachment,
                        data: await res.arrayBuffer(),
                    })
                },
            }}
        >
            <Story />
        </AttachmentProvider>
    ),
}

export const MissingImage: Story = {
    args: {
        children: faker.internet.url(),
        title: generateTitle(),
        description: faker.lorem.sentences({ min: 1, max: 3 }),
    },
}

export const MissingImageAndDescription: Story = {
    args: {
        children: faker.internet.url(),
        title: generateTitle(),
    },
}
