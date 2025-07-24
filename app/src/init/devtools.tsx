import React, { Suspense } from "react"
import ReactDOM from "react-dom/client"

declare const __ENABLE_DEVTOOLS__: boolean

export const initDevTools = __ENABLE_DEVTOOLS__
    ? async () => {
          let mountPoint = document.createElement("div")
          mountPoint.id = "__CONVEYOR_DEVTOOLS__"
          document.body?.appendChild(mountPoint)

          let DevTools = React.lazy(() =>
              import("@/ui/devtools").then(({ DevTools }) => ({
                  default: DevTools,
              })),
          )

          ReactDOM.createRoot(mountPoint).render(
              <Suspense>
                  <DevTools />
              </Suspense>,
          )
      }
    : undefined
