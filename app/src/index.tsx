import "vite/modulepreload-polyfill"

import React, { Suspense } from "react"
import ReactDOM from "react-dom/client"

import { Env } from "@/env"
import { init } from "@/init"
import { fromPromise } from "@/lib/result"
import { App } from "@/ui/App"
import { AttachmentProvider } from "@/ui/attachments"
import { Alert } from "@/ui/components/Alert"
import { NavigationProvider } from "@/ui/navigation"
import { SettingsLoader } from "@/ui/settings"
import type { RootStore } from "@/ui/state"
import { Provider } from "@/ui/state/Provider"

import "@/ui/styles/index.css"

declare const __ENABLE_DEVTOOLS__: boolean

// biome-ignore lint/style/noNonNullAssertion: if this is null all is lost anyway
const rootElement = document.getElementById("__CONVEYOR_UI_ROOT__")!

const serverError = JSON.parse(
    // biome-ignore lint/style/noNonNullAssertion: if this is null all is lost anyway
    document.getElementById("__conveyor_ui_data__")!.innerHTML,
)?.error

main()

const mountDevTools = __ENABLE_DEVTOOLS__
    ? async ({ rootStore }: { rootStore: RootStore }) => {
          let mountPoint = document.createElement("div")
          document.body?.appendChild(mountPoint)

          let DevTools = React.lazy(() =>
              import("@/ui/devtools").then(({ DevTools }) => ({
                  default: DevTools,
              })),
          )

          ReactDOM.createRoot(mountPoint).render(
              <Provider store={rootStore}>
                  <Suspense>
                      <DevTools />
                  </Suspense>
              </Provider>,
          )
      }
    : () => {}

async function main() {
    let initResult = await fromPromise(init())
    if (!initResult.ok) {
        ReactDOM.createRoot(rootElement).render(
            <Alert variant="danger">
                {initResult.err.name}: {initResult.err.message}
                {initResult.err.stack && (
                    <pre>
                        <code>{initResult.err.stack}</code>
                    </pre>
                )}
            </Alert>,
        )
        return
    }

    let { rootStore, attachmentLoader, navCtrl } = initResult.value

    document.body.classList.add(`platform-${Env.platform}`)

    mountDevTools({ rootStore })

    ReactDOM.createRoot(rootElement).render(
        <Provider store={rootStore}>
            <React.StrictMode>
                <NavigationProvider value={navCtrl}>
                    <AttachmentProvider value={attachmentLoader}>
                        <SettingsLoader>
                            <App error={serverError?.error} />
                        </SettingsLoader>
                    </AttachmentProvider>
                </NavigationProvider>
            </React.StrictMode>
        </Provider>,
    )
}
