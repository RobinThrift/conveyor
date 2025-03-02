import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { Button } from "@/ui/components/Button"

import defaultCSS from "./default.css?inline"

const meta: Meta = {
    title: "Belt/Colours",
}

export default meta
type Story = StoryObj

export const Colours: Story = {
    render: () => {
        let start = defaultCSS.indexOf("{")
        let end = defaultCSS.indexOf("--btn-")
        let varnames = defaultCSS
            .substring(start + 2, end)
            .split("\n")
            .filter((l) => l.length !== 0 && !l.includes("font"))
            .map((l) => {
                let start = l.indexOf("-")
                let end = l.indexOf(":")
                return l.substring(start, end)
            })

        let swatches = varnames.map((varname) => (
            <div
                key={varname}
                className="flex justify-start items-start rounded-lg size-20 p-2"
                style={{
                    backgroundColor: `rgb(var(${varname}))`,
                }}
            >
                <span
                    className="text-xs"
                    style={{
                        color: `rgb(var(${varname}))`,
                        filter: "invert(1) grayscale(1) brightness(1.3) contrast(9000)",
                        mixBlendMode: "luminosity",
                        opacity: 0.95,
                    }}
                >
                    {varname}
                </span>
            </div>
        ))

        return (
            <div className="grid grid-cols-2 gap-2">
                <div className="p-2 border border-subtle rounded-lg flex gap-2 flex-wrap w-fit">
                    {swatches}
                </div>

                <div className="p-2 border border-subtle rounded-lg grid grid-cols-4 gap-2 w-full">
                    <Button variant="regular">Regular</Button>
                    <Button variant="primary">Primary</Button>
                    <Button variant="danger">Danger</Button>
                    <Button variant="success">Success</Button>

                    <Button variant="regular" outline={true}>
                        Outline Regular
                    </Button>
                    <Button variant="primary" outline={true}>
                        Outline Primary
                    </Button>
                    <Button variant="danger" outline={true}>
                        Outline Danger
                    </Button>
                    <Button variant="success" outline={true}>
                        Outline Success
                    </Button>

                    <Button variant="regular" plain={true}>
                        Regular (Plain)
                    </Button>
                    <Button variant="primary" plain={true}>
                        Primary (Plain)
                    </Button>
                    <Button variant="danger" plain={true}>
                        Danger (Plain)
                    </Button>
                    <Button variant="success" plain={true}>
                        Success (Plain)
                    </Button>
                </div>
            </div>
        )
    },
}
