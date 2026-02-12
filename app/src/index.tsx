import "vite/modulepreload-polyfill"

import { registerSW } from "virtual:pwa-register"

import React from "react"
import ReactDOM from "react-dom/client"

import { init } from "@/init"
import { fromPromise } from "@/lib/result"
import { PrettyError } from "./ui/components/PrettyError"

import "@/ui/styles/index.css"

// biome-ignore lint/style/noNonNullAssertion: if this is null all is lost anyway
const rootElement = document.getElementById("__CONVEYOR_UI_ROOT__")!

const serverError = JSON.parse(
    // biome-ignore lint/style/noNonNullAssertion: if this is null all is lost anyway
    document.getElementById("__conveyor_ui_data__")!.innerHTML,
)?.error

async function main() {
    setupServiceWorker()

    let [, initErr] = await fromPromise(
        init({
            rootElement,
            serverError,
        }),
    )
    if (initErr) {
        console.error(initErr)
        ReactDOM.createRoot(rootElement).render(<PrettyError error={initErr} />)
        return
    }
}

const swUpdateIntervalMS = 60 * 60 * 1000

async function setupServiceWorker() {
    let update = registerSW({
        immediate: true,
        onNeedRefresh: () => {
            console.log("service worker need refresh")
        },
        onOfflineReady: () => {
            console.log("service worker is offline ready")
        },
        onRegisterError: (err) => {
            console.error(`error registering service worker`, err)
        },

        onRegisteredSW(swURL, r) {
            if (!r) {
                return
            }

            setInterval(async () => {
                if (r.installing) {
                    return
                }

                if (!navigator.onLine) {
                    return
                }

                let res = await fetch(swURL, {
                    cache: "no-store",
                    headers: {
                        cache: "no-store",
                        "cache-control": "no-cache",
                    },
                })

                if (res?.status === 200) {
                    await r.update()
                }
            }, swUpdateIntervalMS)
        },
    })

    try {
        await update()
    } catch (e) {
        console.error("error updating service worker", e)
    }
}

main()
