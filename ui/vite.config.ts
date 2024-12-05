import path from "node:path"
import {
    defineConfig,
    type UserConfig,
    searchForWorkspaceRoot,
    Plugin,
} from "vite"
import react from "@vitejs/plugin-react"

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
                "decode-named-character-reference": path.resolve(
                    __dirname,
                    "node_modules",
                    "decode-named-character-reference",
                    "index.js",
                ),
            },
        },

        plugins: [react()],

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
            manifest: true,
            sourcemap: config.mode === "development" ? "inline" : false,
            minify: config.mode !== "development",
            cssMinify: "lightningcss",

            lib: {
                entry: "./src/index.tsx",
                name: "index",
                fileName: () => "index.js",
                formats: ["es"],
            },

            rollupOptions: {
                input: {
                    "index.js": "./src/index.tsx",
                },
                output: {
                    assetFileNames: (assetInfo) => {
                        if (assetInfo.name === "style.css") return "index.css"
                        return assetInfo.name ?? ""
                    },
                },
            },
        },
    }
})
