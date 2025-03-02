import path from "node:path"
import { defineConfig, type UserConfig, searchForWorkspaceRoot } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig(
    (config): UserConfig => ({
        base: "/assets/",

        publicDir: "build/",

        logLevel: "info",

        define: {
            "import.meta.vitest": "undefined",

            "process.env.NODE_ENV": JSON.stringify(config.mode),
            "process.env.LOG_LEVEL": JSON.stringify("error"),
            __LOG_LEVEL__: JSON.stringify("error"),
            __VERSION__: JSON.stringify("dev"),
            __COMMIT_HASH__: JSON.stringify("main"),
            __COMMIT_DATE__: JSON.stringify(new Date()),
            __PROJECT_LINK__: JSON.stringify(
                "https://github.com/RobinThrift/belt",
            ),
        },

        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
                "@translations": path.resolve(__dirname, "./translations"),
                "@sqlite.org/sqlite-wasm": path.resolve(
                    __dirname,
                    "src/external/sqlite-wasm/build",
                ),
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

        optimizeDeps: {
            exclude: ["@sqlite.org/sqlite-wasm"],
        },

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
            headers: {
                "Cross-Origin-Opener-Policy": "same-origin",
                "Cross-Origin-Embedder-Policy": "require-corp",
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
    }),
)
