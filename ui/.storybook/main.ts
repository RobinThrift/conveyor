import type { StorybookConfig } from "@storybook/react-vite"

const config: StorybookConfig = {
    stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],

    staticDirs: ["./public", { from: "../build/icons", to: "/assets/icons" }],

    addons: ["@storybook/addon-essentials", "@storybook/addon-storysource"],

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
