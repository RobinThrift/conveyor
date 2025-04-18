import { test as setup, expect } from "@playwright/test"

setup("setup", async ({ page }) => {
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
    await page
        .getByRole("textbox", { name: "Password" })
        .fill("pls-change-e2e-tests")
    await page.getByRole("button", { name: "Authenticate" }).click()

    let isFirstTimeSetup = true

    try {
        await page
            .getByText("Incorrect credentials.")
            .waitFor({ timeout: 5_000 })
        isFirstTimeSetup = false
    } catch {
        // password was changed already, continue
    }

    if (isFirstTimeSetup) {
        await page.getByText("Current PasswordNew").click()
        await page.getByRole("textbox", { name: "Current Password" }).click()
        await page
            .getByRole("textbox", { name: "Current Password" })
            .fill("pls-change-e2e-tests")
        await page
            .getByRole("textbox", { name: "Current Password" })
            .press("Tab")
        await page
            .getByRole("textbox", { name: "New Password", exact: true })
            .fill("e2e-tests")
        await page
            .getByRole("textbox", { name: "New Password", exact: true })
            .press("Tab")
        await page
            .getByRole("textbox", { name: "Repeat new Password" })
            .fill("e2e-tests")
        await page.getByRole("button", { name: "Change" }).click()

        await expect(
            page.getByRole("dialog", { name: "Change Password" }),
        ).toBeHidden({ timeout: 10_000 })
    }

    await page.getByRole("textbox", { name: "Password" }).click()
    await page.getByRole("textbox", { name: "Password" }).fill("e2e-tests")
    await page
        .getByRole("button", { name: "Authenticate", exact: true })
        .click()

    await page.waitForURL("http://localhost:8081/")
})
