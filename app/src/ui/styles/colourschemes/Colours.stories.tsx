import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import { Button } from "@/ui/components/Button"

import "@/ui/styles/index.css"

import clsx from "clsx"
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
                    <div className="p-2 border border-neutral rounded-lg flex gap-2 flex-wrap w-fit">
                        {swatches}
                    </div>

                    <div className="p-2 border border-neutral rounded-lg grid grid-cols-3 gap-2 w-full">
                        <Button variant="regular">Regular</Button>
                        <Button variant="primary">Primary</Button>
                        <Button variant="danger">Danger</Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 dark">
                    <div className="p-2 border border-neutral rounded-lg flex gap-2 flex-wrap w-fit bg-body">
                        {swatches}
                    </div>

                    <div className="p-2 border border-neutral rounded-lg grid grid-cols-3 gap-2 w-full bg-body">
                        <Button variant="regular">Regular</Button>
                        <Button variant="primary">Primary</Button>
                        <Button variant="danger">Danger</Button>
                    </div>
                </div>
            </div>
        )
    },
}

export const Surfaces: Story = {
    render: () => {
        let surfaceLevels = ["1", "2", "3"]

        return (
            <div className="flex flex-col gap-10">
                {surfaceLevels.map((level) => (
                    <div key={level} className="grid grid-cols-2 gap-2">
                        {[undefined, "dark"].map((mode) => (
                            <div
                                key={mode}
                                className="flex flex-col gap-2 relative p-2 border border-neutral rounded-lg"
                            >
                                <div className="flex flex-col gap-2 relative h-[400px] overflow-auto">
                                    <p>{faker.lorem.sentences({ min: 5, max: 10 })}</p>

                                    <img
                                        alt="img-1"
                                        src={faker.image.urlPicsumPhotos({
                                            width: 600,
                                            height: 400,
                                        })}
                                    />

                                    <p>{faker.lorem.sentences({ min: 5, max: 10 })}</p>

                                    <img
                                        alt="img-2"
                                        src={faker.image.urlPicsumPhotos({
                                            width: 600,
                                            height: 400,
                                        })}
                                    />

                                    <p>{faker.lorem.sentences({ min: 5, max: 10 })}</p>
                                </div>

                                <div
                                    className={clsx(
                                        mode,
                                        `surface-level-${level}`,
                                        "p-2 rounded-2xl elevation-1 absolute left-[30%] w-[40%] top-50 -translate-y-1/2",
                                    )}
                                >
                                    <h3>Surface Level {level}</h3>
                                    {faker.lorem.sentences({ min: 10, max: 15 })}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        )
    },
}
