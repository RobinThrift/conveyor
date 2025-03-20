import { defineConfig, mergeConfig } from "vitest/config"
import viteConfig from "./vite.config"

export default defineConfig(async (configEnv) =>
    mergeConfig(
        await viteConfig(configEnv),
        defineConfig({
            test: {
                includeSource: ["src/**/*.ts"],

                typecheck: {
                    enabled: true,
                },

                browser: {
                    provider: "playwright",
                    enabled: true,
                    instances: [{ browser: "chromium" }],
                    headless: true,
                    screenshotFailures: false,
                },
            },
        }),
    ),
)
