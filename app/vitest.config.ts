import { defineConfig, mergeConfig } from "vitest/config"
import viteConfig from "./vite.config"

export default defineConfig(async (configEnv) =>
    mergeConfig(
        await viteConfig(configEnv),
        defineConfig({
            define: {
                __ENABLE_DB_LOGGING__: "false",
                __ENABLE_DEVTOOLS__: "false",
            },
            test: {
                includeSource: ["src/**/*.ts"],
                include: ["src/**/*.{test,spec}.?(c|m)[jt]s?(x)"],

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
