import { exec as nodeexec } from "node:child_process"
import path from "node:path"
import * as process from "node:process"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react-swc"
import type { GetModuleInfo } from "rollup"
import { defineConfig, searchForWorkspaceRoot, type UserConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig(async (config): Promise<UserConfig> => {
    let vcsInfo = await getVCSInfo()

    let isTauri = process.env.TAURI_ENV_DEBUG
    let host = process.env.TAURI_DEV_HOST

    return {
        base: isTauri ? "/" : "/assets/",

        publicDir: "build/",

        logLevel: "info",

        define: {
            "import.meta.vitest": "undefined",

            "process.env.NODE_ENV": JSON.stringify(config.mode),

            __ENABLE_DEVTOOLS__: config.mode === "development" ? "true" : "false",

            __PLATFORM__: JSON.stringify(isTauri ? "TAURI" : "WEB"),
            __LOG_LEVEL__: JSON.stringify(config.mode === "development" ? "debug" : "error"),
            __VERSION__: JSON.stringify(`${vcsInfo.version}${vcsInfo.suffix}`),
            __COMMIT_HASH__: JSON.stringify(vcsInfo.hash),
            __COMMIT_DATE__: JSON.stringify(vcsInfo.date),
            __PROJECT_LINK__: JSON.stringify("https://github.com/RobinThrift/conveyor"),
        },

        resolve: {
            alias: [
                { find: "@", replacement: path.resolve(__dirname, "./src") },
                { find: "@translations", replacement: path.resolve(__dirname, "./translations") },
                {
                    find: "@sqlite.org/sqlite-wasm",
                    replacement: path.resolve(__dirname, "src/external/sqlite-wasm/build"),
                },
                {
                    find: "decode-named-character-reference",
                    replacement: path.resolve(
                        __dirname,
                        "node_modules",
                        "decode-named-character-reference",
                        "index.js",
                    ),
                },
                {
                    find: /langium\/(.*)/,
                    replacement: path.resolve(__dirname, "node_modules", "langium", "$1"),
                },
                {
                    find: /.*(uri-utils|lsp|vscode-languageserver-protocol|vscode-jsonrpc).*/,
                    replacement: path.resolve(
                        __dirname,
                        "node_modules",
                        "@robinthrift",
                        "minimal-mermaid",
                        "build",
                        "langium.js",
                    ),
                },
            ],
        },

        plugins: [
            tailwindcss(),
            react({ devTarget: "es2024" }),
            VitePWA({
                registerType: "prompt",
                injectRegister: false,
                manifest: false,
                scope: "/",
                workbox: {
                    globPatterns: ["**/*.{js,css,svg,png,woff2,wasm}"],
                    navigateFallback: null,
                    maximumFileSizeToCacheInBytes: 3000000, // 3MiB

                    runtimeCaching: [
                        {
                            urlPattern: /\/manifest.json/,
                            handler: "StaleWhileRevalidate",
                        },
                        {
                            urlPattern: /\/$/,
                            handler: "StaleWhileRevalidate",
                        },
                        {
                            urlPattern: /\/unlock$/,
                            handler: "StaleWhileRevalidate",
                        },
                        {
                            urlPattern: /\/settings/,
                            handler: "StaleWhileRevalidate",
                        },
                        {
                            urlPattern: /index.html/,
                            handler: "StaleWhileRevalidate",
                        },
                        {
                            urlPattern: /.*\.wasm$/,
                            handler: "StaleWhileRevalidate",
                        },
                        {
                            urlPattern: /.*\.worker-*.\.js$/,
                            handler: "StaleWhileRevalidate",
                        },
                        {
                            urlPattern: /.*workbox-window\.prod.*/,
                            handler: "StaleWhileRevalidate",
                        },
                    ],
                },
            }),
        ],

        optimizeDeps: {
            exclude: ["@sqlite.org/sqlite-wasm", "bippy"],
        },

        server: {
            host: host || false,

            headers: {
                "Cross-Origin-Opener-Policy": "same-origin",
                "Cross-Origin-Embedder-Policy": "require-corp",
            },

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

            hmr: host
                ? {
                      protocol: "ws",
                      host,
                      port: 1421,
                  }
                : undefined,

            watch: {
                ignored: ["**/src-tauri/**"],
            },
        },

        worker: {
            format: "es",
        },

        esbuild: {
            target: "es2024",
        },

        build: {
            outDir: "build",
            emptyOutDir: true,
            assetsDir: "",
            sourcemap: config.mode === "development" ? "inline" : false,
            // minify: config.mode !== "development",
            minify: false,
            cssMinify: "lightningcss",

            reportCompressedSize: false,

            rollupOptions: {
                input: {
                    index: "./src/index.tsx",
                },
                preserveEntrySignatures: "strict",
                output: {
                    entryFileNames: () => `[name].${vcsInfo.hash.substring(0, 16)}.js`,

                    assetFileNames: (assetInfo) => {
                        if (assetInfo.names[0] === "index.css") {
                            return `index.${vcsInfo.hash.substring(0, 16)}.css`
                        }

                        if (/woff2?$/.test(assetInfo.names[0])) {
                            return "fonts/[name][extname]"
                        }

                        return assetInfo.names[0] ?? ""
                    },

                    hoistTransitiveImports: false,
                    manualChunks,
                },
            },
        },
    }
})

function manualChunks(
    id: string,
    _: { getModuleInfo: GetModuleInfo; getModuleIds: () => IterableIterator<string> },
) {
    let translations = /app\/translations\/([a-z]+)\.(?:json|ts)/
    let matches = translations.exec(id)
    if (matches) {
        return `i18n/${matches[1]}`
    }

    let codemirrorLang = /codemirror\/(?:lang-([a-z]+))|(?:legacy-modes\/mode\/([a-z]+))/
    matches = codemirrorLang.exec(id)
    if (matches) {
        return `codemirror/lang-${matches[1] || matches[2]}`
    }

    let lezer = /@lezer\/([a-z]+)/
    matches = lezer.exec(id)
    if (matches) {
        return `codemirror/lang-${matches[1]}`
    }

    if (/codemirror/.test(id)) {
        return "codemirror"
    }

    if (/lib\/markdown/.test(id)) {
        return "markdown"
    }

    if (/three/.test(id)) {
        return "threejs"
    }

    let mermaidPkg = mermaidPackageName(id)
    if (mermaidPkg) {
        return mermaidPkg
    }

    let migrations = /app\/src\/storage\/database\/sqlite\/migrations\/([\da-z_]+)/
    matches = migrations.exec(id)
    if (matches) {
        return `migrations/${matches[1]}`
    }

    let modelViewer = /app\/src\/ui\/components\/Attachment\/viewers\/([\dA-Za-z_]+)/
    matches = modelViewer.exec(id)
    if (matches) {
        return `viewers/${matches[1]}`
    }
}

async function getVCSInfo() {
    try {
        let [version, numCommits, hash] = (
            await exec("git describe --tags --long --abbrev=40")
        ).split("-")

        let date = await exec(`git show --no-patch --format=%ci ${version}`)

        return {
            version,
            suffix: numCommits !== "0" ? `-${numCommits}` : "",
            hash: hash.substring(1),
            date,
        }
    } catch (err) {
        console.warn(err)
    }

    return {
        version: "dev",
        suffix: "",
        hash: "dev",
        date: new Date(),
    }
}

async function exec(cmd: string): Promise<string> {
    let { resolve, reject, promise } = Promise.withResolvers<string>()

    nodeexec(cmd, (err, stdout) => {
        if (err) {
            reject(err)
            return
        }
        resolve(stdout.trim())
    })

    return promise
}

function mermaidPackageName(id: string): string | undefined {
    if (/cose/.test(id)) {
        return "mermaid/layouts-cose"
    }

    if (/chevrotain|cytoscape|dagre|layout-algorithms/.test(id)) {
        return "mermaid/layouts"
    }

    if (/lodash-es/.test(id)) {
        return "mermaid/deps-lodash"
    }

    if (/d3|dompurify|rough|langium/.test(id)) {
        return "mermaid/deps"
    }

    if (/langium/.test(id)) {
        return "mermaid/langium"
    }

    if (/mermaid/.test(id)) {
        return "mermaid"
    }
}
