import type { StorybookConfig } from "@storybook/react-vite"
import process from "node:process"

process.env.VITE_USE_HASH_HISTORY = "true"

const config: StorybookConfig = {
    stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],

    staticDirs: [
        "./public",
        { from: "../../api", to: "/assets/apispecs" },
        { from: "../build/icons", to: "/assets/icons" },
        { from: "../build/sqlite3", to: "/assets/sqlite3" },
    ],

    addons: ["@storybook/addon-docs"],

    framework: {
        name: "@storybook/react-vite",
        options: {},
    },

    docs: {},

    core: {
        disableTelemetry: true,
    },
}

export default config
