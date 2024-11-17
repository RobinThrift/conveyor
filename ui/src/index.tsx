import React from "react"
import ReactDOM from "react-dom/client"
import { App, type AppProps } from "./App"
import "@/index.css"

document.documentElement.classList.toggle(
    "dark",
    window.matchMedia("(prefers-color-scheme: dark)").matches,
)

let globalData: AppProps = JSON.parse(
    // biome-ignore lint/style/noNonNullAssertion: if this is null all is lost anyway
    document.getElementById("__belt_ui_data__")!.innerHTML,
)

// biome-ignore lint/style/noNonNullAssertion: if this is null all is lost anyway
ReactDOM.createRoot(document.getElementById("__BELT_UI_ROOT__")!).render(
    <React.StrictMode>
        <App {...globalData} />
    </React.StrictMode>,
)
