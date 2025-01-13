import path from "node:path"
import {
    defineConfig,
    type UserConfig,
    searchForWorkspaceRoot,
    Plugin,
} from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig(async (config): Promise<UserConfig> => {
    return {
        base: "/assets/",

        publicDir: "build/",

        logLevel: "info",

        define: {
            "process.env.LOG_LEVEL": JSON.stringify("error"),
            "process.env.NODE_ENV": JSON.stringify(config.mode),
        },

        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
                "@testhelper": path.resolve(__dirname, ".storybook/helper.ts"),
                "decode-named-character-reference": path.resolve(
                    __dirname,
                    "node_modules",
                    "decode-named-character-reference",
                    "index.js",
                ),
            },
        },

        plugins: [
            react(),
            VitePWA({
                strategies: "generateSW",
                registerType: "prompt",
                manifest: false,
                scope: "/assets/",
                workbox: {
                    globPatterns: ["**/*.{js,css,svg,woff2}"],
                    navigateFallback: null,
                },
            }),
        ],

        server: {
            proxy: {
                "^/assets/icons/.*": {
                    target: "http://localhost:6155",
                    rewrite: (path) =>
                        path.replace(
                            /^\/assets\/icons/,
                            `/assets/@fs/${searchForWorkspaceRoot(process.cwd())}/build/icons`,
                        ),
                },
            },
        },

        build: {
            outDir: "build",
            emptyOutDir: true,
            assetsDir: "",
            sourcemap: config.mode === "development" ? "inline" : false,
            minify: config.mode !== "development",
            cssMinify: "lightningcss",

            rollupOptions: {
                input: {
                    index: "./src/index.tsx",
                },
                output: {
                    entryFileNames: "[name].js",
                    assetFileNames: (assetInfo) => {
                        if (assetInfo.names[0] === "index.css")
                            return "index.css"
                        return assetInfo.names[0] ?? ""
                    },
                },
            },
        },
    }
})
