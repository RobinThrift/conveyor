import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import type { Attachment } from "@/domain/Attachment"
import { Second } from "@/lib/duration"
import { Ok } from "@/lib/result"
import { delay } from "@/lib/testhelper/delay"
import { withMockBackend } from "@/lib/testhelper/storybook"

import "@/ui/styles/index.css"

import { ZoomableImage } from "./ZoomableImage"

const meta: Meta<typeof ZoomableImage> = {
    title: "Components/Image/Zoomable",
    component: ZoomableImage,
}

export default meta
type Story = StoryObj<typeof ZoomableImage>

export const Overview: Story = {
    name: "Zoomable",

    parameters: {
        layout: "centered",
    },

    args: {
        className: "max-w-[500px]",
        src: faker.image.urlPicsumPhotos({ width: 1600, height: 1400 }),
        alt: faker.lorem.words(5),
        caption: faker.lorem.sentences({ min: 2, max: 5 }),
    },
}

export const InArticle: Story = {
    parameters: {
        layout: "centered",
    },

    args: {
        className: "max-w-[200px]",
    },

    render: (args) => {
        return (
            <article className="container">
                <p>{faker.lorem.paragraph()}</p>
                <p>{faker.lorem.paragraph()}</p>
                <ZoomableImage
                    {...args}
                    src={
                        args.src ??
                        faker.image.urlPicsumPhotos({
                            width: 1600,
                            height: 1400,
                        })
                    }
                    alt={args.alt ?? faker.lorem.words(5)}
                    caption={args.caption ?? faker.lorem.sentences({ min: 2, max: 5 })}
                />
                <p>{faker.lorem.paragraph()}</p>
                <p>{faker.lorem.paragraph()}</p>
                <ZoomableImage
                    {...args}
                    src={
                        args.src ??
                        faker.image.urlPicsumPhotos({
                            width: 2000,
                            height: 2000,
                        })
                    }
                    alt={args.alt ?? faker.lorem.words(5)}
                    caption={args.caption ?? faker.lorem.sentences({ min: 2, max: 5 })}
                />
                <p>{faker.lorem.paragraph()}</p>
                <ZoomableImage
                    {...args}
                    src={
                        args.src ??
                        faker.image.urlPicsumPhotos({
                            width: 1400,
                            height: 1600,
                        })
                    }
                    alt={args.alt ?? faker.lorem.words(5)}
                    caption={args.caption ?? faker.lorem.sentences({ min: 2, max: 5 })}
                />
                <p>{faker.lorem.paragraph()}</p>
            </article>
        )
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
