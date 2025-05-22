import { test, expect } from "@playwright/test"

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

    await page.locator(".text-editor").click()
    await page.getByLabel("Text formatting").isVisible()
    await page
        .getByTestId("texteditor")
        .getByRole("textbox")
        .fill("# Test Memo\n\nWith Some Content")
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText(/^Test Memo/)).toBeInViewport({
        timeout: 10_000,
    })

    await expect(page.getByText(/^With Some Content/)).toBeInViewport({
        timeout: 10_000,
    })
})
