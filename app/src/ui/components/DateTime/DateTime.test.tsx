/// <reference types="@vitest/browser/providers/playwright" />
import React from "react"
import { expect, suite, test } from "vitest"
import { render } from "vitest-browser-react"

import { subHours } from "date-fns"
import { DateTime } from "./DateTime"

suite("ui/components/DateTime", () => {
    test("relative", async () => {
        let datetime = subHours(new Date(), 1)

        let rendered = render(<DateTime date={datetime} relative={true} />)

        await expect
            .element(rendered.getByRole("button"))
            .toHaveTextContent(/about .* ago/)

        await rendered.getByRole("button").click()

        await expect
            .element(rendered.getByRole("button"))
            .toHaveTextContent(new RegExp(`${datetime.getDate()}`))

        await expect
            .element(rendered.getByRole("button"))
            .toHaveTextContent(new RegExp(`${datetime.getFullYear()}`))
    })
})
