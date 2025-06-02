import { test } from "@playwright/test"
import { createMemoFromMainScreen } from "../steps/create-memo-from-main-screen"

test("setup/new/local-only", async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.getItem = () => null
        window.localStorage.setItem = () => null
    })

    await page.goto("http://localhost:8081/setup")
    await page.getByRole("button", { name: "New" }).click()
    await page.getByRole("button", { name: "Generate Private Key" }).click()
    await page.getByRole("button", { name: "Next" }).click()
    await page.getByRole("button", { name: "Next" }).click()

    await page.waitForURL("http://localhost:8081/")

    await createMemoFromMainScreen({
        content: "# Local Only Setup Test\n\nWith Some Content",
        checks: [/^Local Only Setup Test/, /^With Some Content/],
        page,
    })
})
