/// <reference types="@vitest/browser/providers/playwright" />
import React from "react"
import { expect, suite, test } from "vitest"
import { render } from "vitest-browser-react"

import { generateRealisticBody } from "@/lib/testhelper/memos"
import { Provider, configureRootStore } from "@/ui/state"

import { Markdown } from "./Markdown"

suite("ui/components/Markdown", () => {
    test("Markdown", async () => {
        let raw = `# Markdown Test\n #tag-1 #tag-2\n${generateRealisticBody()}`

        let rendered = render(
            <Provider store={configureRootStore()}>
                <Markdown id="test-memo-id">{raw}</Markdown>
            </Provider>,
        )

        await expect
            .element(rendered.getByRole("heading", { level: 1 }))
            .toHaveTextContent("Markdown Test")

        await expect.element(rendered.getByText("tag-1")).toBeInTheDocument()

        await expect.element(rendered.getByText("tag-2")).toBeInTheDocument()
    })
})
