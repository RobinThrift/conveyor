import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import type { Attachment } from "@/domain/Attachment"
import { Millisecond, Second } from "@/lib/duration"
import { Ok } from "@/lib/result"
import { delay } from "@/lib/testhelper/delay"
import { withMockBackend } from "@/lib/testhelper/storybook"

import "@/ui/styles/index.css"

import { Image } from "./Image"

const meta: Meta<typeof Image> = {
    title: "Components/Image",
    component: Image,
}

export default meta
type Story = StoryObj<typeof Image>

export const Overview: Story = {
    name: "Image",

    parameters: {
        layout: "centered",
    },

    args: {
        className: "max-w-[800px]",
        alt: faker.lorem.words(5),
        src: faker.image.urlPicsumPhotos({ width: 1600, height: 1400 }),
    },
}

export const AttachmentWithThumbHash: Story = {
    parameters: {
        layout: "centered",
    },

    args: {
        src: "attachment://yLAy-2K3mImfADHe9exZr?thumbhash=GhgWJIJ/dYiaiIhnh4f5d/qGhg==",
    },

    decorators: [
        withMockBackend({
            mockAttachments: {
                "yLAy-2K3mImfADHe9exZr": async () => {
                    let res = await fetch(
                        "https://images.unsplash.com/photo-1740393148421-2159bf9e8d8e?q=80&w=6132&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    )

                    await delay(5 * Second)

                    return Ok({
                        attachment: {} as Attachment,
                        data: await res.arrayBuffer(),
                    })
                },
            },
        }),
    ],
}

export const LazyLoadAttachment: Story = {
    parameters: {
        layout: "fullscreen",
    },

    args: {
        src: "attachment://yLAy-2K3mImfADHe9exZr?thumbhash=GhgWJIJ/dYiaiIhnh4f5d/qGhg==",
    },

    decorators: [
        withMockBackend({
            mockAttachments: {
                "yLAy-2K3mImfADHe9exZr": async () => {
                    let res = await fetch(
                        "https://images.unsplash.com/photo-1740393148421-2159bf9e8d8e?q=80&w=6132&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    )

                    await delay(500 * Millisecond)

                    return Ok({
                        attachment: {} as Attachment,
                        data: await res.arrayBuffer(),
                    })
                },
            },
        }),
    ],

    render: (args) => (
        <div className="overflow-auto h-screen">
            <div className="py-[150vh] flex justify-center">
                <Image {...args} />
            </div>
        </div>
    ),
}
