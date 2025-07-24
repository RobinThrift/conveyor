import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import type { Attachment } from "@/domain/Attachment"
import { Second } from "@/lib/duration"
import { Ok } from "@/lib/result"
import { delay } from "@/lib/testhelper/delay"
import { generateTitle } from "@/lib/testhelper/memos"
import { withMockBackend } from "@/lib/testhelper/storybook"

import "@/ui/styles/index.css"

import { LinkPreview } from "./LinkPreview"

const meta: Meta<typeof LinkPreview> = {
    title: "Components/LinkPreview",
    component: LinkPreview,
    decorators: [
        (Story) => (
            <div className="content @container container mx-auto">
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof LinkPreview>

const exampleImages = [
    "https://images.unsplash.com/photo-1740393148421-2159bf9e8d8e?q=80&w=6132&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://unsplash.com/photos/UoG3GwtvF-Y/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQ2MDIzNTUxfA&force=true&w=640",
    "https://unsplash.com/photos/xZxZhGct3f4/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQ2MDEzMzQ3fA&force=true&w=640",
    "https://unsplash.com/photos/1RQFOp5LWrI/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQ2MDI2MzQwfA&force=true&w=640",
    "https://unsplash.com/photos/tuRraTuflBA/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQ1OTk2MjQwfA&force=true&w=640",
    "https://plus.unsplash.com/premium_photo-1672743593121-ddc2fee0e62b?q=80&w=5412&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://plus.unsplash.com/premium_photo-1666277012916-1c1c7bc88122?q=80&w=6016&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://unsplash.com/photos/24h4vWNHjJE/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQ2MDI1NjI1fA&force=true&w=640",
    "https://plus.unsplash.com/premium_photo-1706800282326-6e5d2103646b?q=80&w=3537&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://plus.unsplash.com/premium_photo-1668708034541-4ba9a33fae3a?q=80&w=6270&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://unsplash.com/photos/8jwJlv4g3dg/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQ2MDI0OTgwfA&force=true&w=640",
    "https://unsplash.com/photos/sC05mkDUs1k/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQ2MDE1Njg1fA&force=true&w=640",
    "https://plus.unsplash.com/premium_photo-1742945845688-d2e666a3b92a?q=80&w=5330&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://unsplash.com/photos/jjiSx1-xTrA/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQ2MDI4MDU4fA&force=true&w=640",
    "https://unsplash.com/photos/PSD0PPhxUgE/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQ2MDI4Mjg3fA&force=true&w=640",
    "https://unsplash.com/photos/gVJc96Cf5N8/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQ2MDI4Mjg4fA&force=true&w=640",
]

export const Overview: Story = {
    args: {
        children: faker.internet.url(),
        img: faker.image.urlPicsumPhotos({ width: 1200, height: 600 }),
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

    decorators: [
        withMockBackend({
            mockAttachments: {
                "yLAy-2K3mImfADHe9exZr": async () => {
                    let res = await fetch(exampleImages[0])

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

export const LightAndDarkImages: Story = {
    args: {
        children: faker.internet.url(),
        title: generateTitle(),
        description: faker.lorem.sentences({ min: 1, max: 2 }),
    },

    render: (args) => (
        <div className="grid tablet:grid-cols-2 tablet:gap-4 md:grid-cols-4 md:gap-8">
            {exampleImages.map((img) => (
                <LinkPreview key={img} {...args} img={img} />
            ))}
        </div>
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

export const ErrorImage: Story = {
    args: {
        children: faker.internet.url(),
        title: generateTitle(),
        img: "invalid url",
        description: faker.lorem.sentences({ min: 1, max: 3 }),
    },
}
