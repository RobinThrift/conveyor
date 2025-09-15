import { expect, type Page } from "@playwright/test"

export async function createMemoFromMainScreen({
    content,
    checks,
    page,
}: {
    content: string
    checks: RegExp[]
    page: Page
}) {
    await page.getByRole("navigation").getByText("New memo").click()

    await page.locator(".text-editor").click()
    await page.getByLabel("Text formatting").isVisible()
    await page.getByTestId("texteditor").getByRole("textbox").fill(content)
    await page.getByRole("button", { name: "Save" }).click()

    for (let check of checks) {
        await expect(page.getByText(check)).toBeInViewport({
            timeout: 10_000,
        })
    }
}
