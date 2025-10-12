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
    registerSW({ immediate: true })

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

main()
