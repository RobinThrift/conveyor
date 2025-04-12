/// <reference types="@vitest/browser/providers/playwright" />
import React from "react"
import { expect, suite, test } from "vitest"
import { render } from "vitest-browser-react"

import { currentDateTime } from "@/lib/i18n"
import { DateTime } from "./DateTime"

suite("ui/components/DateTime", () => {
    test("relative", async () => {
        let datetime = currentDateTime().subtract({ hours: 2 })

        let rendered = render(<DateTime date={datetime} relative={true} />)

        await expect
            .element(rendered.getByRole("button"))
            .toHaveTextContent(/.* ago/)

        await rendered.getByRole("button").click()

        await expect
            .element(rendered.getByRole("button"))
            .toHaveTextContent(new RegExp(`${datetime.day}`))

        await expect
            .element(rendered.getByRole("button"))
            .toHaveTextContent(new RegExp(`${datetime.year}`))
    })
})
