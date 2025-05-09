import React, { startTransition, Suspense, useEffect, useState } from "react"

import { ReduxDevTools } from "./ReduxDevTools"
import { SQLLogDevTool } from "./SQLLogDevTool"
import { Loader } from "../components/Loader"
import { PerformanceDevTool } from "./Performance"
import { ReactDevTools } from "./ReactDevTools"
import { FPSMeter } from "./FPSMeter"

let tabs = {
    Redux: <ReduxDevTools />,
    React: <ReactDevTools />,
    "SQL Log": <SQLLogDevTool />,
    Perfomance: <PerformanceDevTool />,
}

export function DevTools() {
    let [isOpen, setIsOpen] = useState(false)
    let [tab, setTab] = useState<keyof typeof tabs>("Redux")

    useEffect(() => {
        if (!isOpen) {
            return
        }

        let closeFn = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                startTransition(() => {
                    setIsOpen(false)
                })
            }
        }

        window.addEventListener("keyup", closeFn)

        return () => {
            window.removeEventListener("keyup", closeFn)
        }
    }, [isOpen])

    return (
        <div className="fixed bottom-0 right-0 p-3 h-screen z-[100000] overscroll-contain pointer-events-none dark">
            {isOpen && (
                <div
                    className="h-full p-3 w-[40dvw] overflow-auto pointer-events-auto bg-surface-level-1/80 backdrop-blur-sm rounded-lg animate-in slide-in-from-right-96 shadow-xl"
                    tabIndex={-1}
                >
                    <Suspense key={tab} fallback={<Loader />}>
                        {tabs[tab]}
                    </Suspense>
                </div>
            )}

            <nav className="fixed bottom-2 right-2 flex gap-2 pointer-events-auto">
                {Object.keys(tabs).map((tabname) => (
                    <button
                        key={tabname}
                        type="button"
                        className="bg-[var(--btn-bg)]/50 backdrop-blur-xs text-sm py-1! px-2! h-fit rounded-full text-[var(--btn-color)] hover:bg-[var(--btn-bg)]/80 cursor-pointer"
                        onClick={() =>
                            startTransition(() => {
                                if (isOpen && tabname === tab) {
                                    setIsOpen(false)
                                    return
                                }

                                setIsOpen(true)
                                setTab(tabname as keyof typeof tabs)
                            })
                        }
                    >
                        {tabname}
                    </button>
                ))}
                <FPSMeter />
            </nav>
        </div>
    )
}
