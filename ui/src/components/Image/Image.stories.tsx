import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Image } from "./Image"
import { faker } from "@faker-js/faker"

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
        className: "max-w-[200px]",
        alt: faker.lorem.words(5),
        caption: faker.lorem.words(10),
    },

    render: (args) => {
        return (
            <article className="container">
                <p>{faker.lorem.paragraph()}</p>
                <p>{faker.lorem.paragraph()}</p>
                <Image
                    {...args}
                    src={faker.image.url({ width: 1600, height: 1400 })}
                />
                <p>{faker.lorem.paragraph()}</p>
                <p>{faker.lorem.paragraph()}</p>
                <Image
                    {...args}
                    src={faker.image.url({ width: 2000, height: 2000 })}
                />
                <p>{faker.lorem.paragraph()}</p>
                <Image
                    {...args}
                    src={faker.image.url({ width: 1400, height: 1600 })}
                />
                <p>{faker.lorem.paragraph()}</p>
            </article>
        )
    },
}
