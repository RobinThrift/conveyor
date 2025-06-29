import path from "node:path"
import { exec as nodeexec } from "node:child_process"
import * as process from "node:process"
import { defineConfig, type UserConfig, searchForWorkspaceRoot } from "vite"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react-swc"

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

            __ENABLE_DEVTOOLS__:
                config.mode === "development" ? "true" : "false",

            __PLATFORM__: JSON.stringify(isTauri ? "TAURI" : "WEB"),
            __LOG_LEVEL__: JSON.stringify(
                config.mode === "development" ? "debug" : "error",
            ),
            __VERSION__: JSON.stringify(`${vcsInfo.version}${vcsInfo.suffix}`),
            __COMMIT_HASH__: JSON.stringify(vcsInfo.hash),
            __COMMIT_DATE__: JSON.stringify(vcsInfo.date),
            __PROJECT_LINK__: JSON.stringify(
                "https://github.com/RobinThrift/conveyor",
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

        plugins: [tailwindcss(), react({ devTarget: "es2024" })],

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
            minify: config.mode !== "development",
            cssMinify: "lightningcss",

            reportCompressedSize: false,

            rollupOptions: {
                input: {
                    index: "./src/index.tsx",
                },
                output: {
                    entryFileNames: `[name].${vcsInfo.hash.substring(0, 16)}.js`,
                    assetFileNames: (assetInfo) => {
                        if (assetInfo.names[0] === "index.css")
                            return `index.${vcsInfo.hash.substring(0, 16)}.css`
                        return assetInfo.names[0] ?? ""
                    },
                },
            },
        },
    }
})

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
