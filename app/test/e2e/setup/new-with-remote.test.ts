import { test } from "@playwright/test"
import { createMemoFromMainScreen } from "../steps/create-memo-from-main-screen"

test("setup/new/with-remote", async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.getItem = () => null
        window.localStorage.setItem = () => null
    })

    await page.goto("http://localhost:8081/setup")
    await page.getByRole("button", { name: "New" }).click()
    await page.getByRole("button", { name: "Generate Private Key" }).click()
    await page.getByRole("button", { name: "Next" }).click()
    await page.getByText("Sync With Remote Server").click()
    await page.getByRole("button", { name: "Next" }).click()
    await page.getByRole("textbox", { name: "Username" }).click()
    await page.getByRole("textbox", { name: "Username" }).fill("user")
    await page.getByRole("textbox", { name: "Password" }).click()
    await page.getByRole("textbox", { name: "Password" }).fill("e2e-tests")
    await page.getByRole("button", { name: "Authenticate" }).click()

    await page.waitForURL("http://localhost:8081/")

    await createMemoFromMainScreen({
        content: "# Remote Sync Setup Test\n\nWith Some Content",
        checks: [/^Remote Sync Setup Test/, /^With Some Content/],
        page,
    })
})
