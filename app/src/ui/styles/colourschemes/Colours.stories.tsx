import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import { Button } from "@/ui/components/Button"

import "@/ui/styles/index.css"

import { useMemo } from "storybook/internal/preview-api"
import defaultCSS from "./default.css?inline"

const meta: Meta = {
    title: "Conveyor/Colours",
}

const cssVarPattern = /(--[a-z-]+):/gm

export default meta
type Story = StoryObj

export const Colours: Story = {
    render: () => {
        let start = defaultCSS.indexOf("{")
        let end = defaultCSS.indexOf("--btn-")
        let varnames = useMemo(() => {
            let varnames: string[] = []
            let css = defaultCSS.substring(start + 2, end)

            let matches = cssVarPattern.exec(css)
            cssVarPattern.lastIndex = 0

            while (matches !== null) {
                if (!matches[1].startsWith("--color")) {
                    matches = cssVarPattern.exec(css)
                    continue
                }

                varnames.push(matches[1])

                matches = cssVarPattern.exec(css)
            }

            return varnames
        }, [])

        let swatches = varnames.map((varname) => (
            <div
                key={varname}
                className="flex justify-start items-start rounded-lg size-20 p-2"
                style={{
                    backgroundColor: `var(${varname})`,
                }}
            >
                <span
                    className="text-xs"
                    style={{
                        color: `var(${varname})`,
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
            <div className="flex flex-col gap-10">
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

                <div className="grid grid-cols-2 gap-2 dark">
                    <div className="p-2 border border-subtle rounded-lg flex gap-2 flex-wrap w-fit bg-body">
                        {swatches}
                    </div>

                    <div className="p-2 border border-subtle rounded-lg grid grid-cols-4 gap-2 w-full bg-body">
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
            </div>
        )
    },
}
