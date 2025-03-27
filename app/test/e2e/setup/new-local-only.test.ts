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

    await Promise.all([
        page.waitForURL("http://localhost:8081/"),
        page.waitForEvent("console", {
            predicate: (msg) => {
                return msg.text().includes("database fully migrated")
            },
            timeout: 10_000,
        }),
    ])

    await page.locator(".text-editor").click()
    await page.getByRole("textbox").pressSequentially("# Test Memo")
    await page.getByRole("textbox").press("Enter")
    await page.getByRole("textbox").press("Enter")
    await page.getByRole("textbox").pressSequentially("With Some Content")
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText(/^Test Memo/)).toBeInViewport({
        timeout: 10_000,
    })

    await expect(page.getByText(/^With Some Content/)).toBeInViewport({
        timeout: 10_000,
    })
})
