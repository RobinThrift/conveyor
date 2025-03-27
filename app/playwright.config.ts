import { defineConfig, devices } from "@playwright/test"
import * as process from "node:process"

export default defineConfig({
    testDir: "./test/e2e",

    fullyParallel: true,

    forbidOnly: !!process.env.CI,

    retries: process.env.CI ? 2 : 0,

    workers: process.env.CI ? 1 : undefined,

    reporter: process.env.CI ? "github" : "list",

    use: {
        baseURL: "http://localhost:8081",
        trace: "on-first-retry",
    },

    projects: [
        {
            name: "setup",
            testMatch: /global\.setup\.ts/,
        },

        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
            dependencies: ["setup"],
        },

        // {
        //     name: "webkit",
        //     use: { ...devices["Desktop Safari"] },
        //     dependencies: ["setup"],
        // },
        //
        // {
        //     name: "firefox",
        //     use: { ...devices["Desktop Firefox"] },
        // },
    ],

    webServer: [
        {
            command:
                "just -d ../server -f ../server/justfile _run-for-e2e-test",
            url: "http://127.0.0.1:8081",
            reuseExistingServer: !process.env.CI,
        },
        {
            command: "just serve",
            url: "http://localhost:6155/assets/src/index.tsx",
            reuseExistingServer: true,
        },
    ],
})
