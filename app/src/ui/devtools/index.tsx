import clsx from "clsx"
import React, {
    startTransition,
    Suspense,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react"

import { FlaskIcon, XIcon } from "../components/Icons"
import { Loader } from "../components/Loader"
import { FPSMeter } from "./FPSMeter"
import { ReactDevTools } from "./ReactDevTools"
import { ReduxDevTools } from "./ReduxDevTools"
import { SQLLogDevTool } from "./SQLLogDevTool"
import { TracingDevTool } from "./TracingDevTool"

import "./DevTools.css"

let tabs = {
    Redux: <ReduxDevTools />,
    Trace: <TracingDevTool />,
    React: <ReactDevTools />,
    "SQL Log": <SQLLogDevTool />,
}

export function DevTools() {
    let [isOpen, setIsOpen] = useState(false)
    let [activeTab, setActiveTab] = useState<keyof typeof tabs>("Redux")

    useEffect(() => {
        if (!isOpen) {
            return
        }

        let closeFn = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                startTransition(() => {
                    isDragging.current = false
                    setIsOpen(false)
                })
            }
        }

        window.addEventListener("keyup", closeFn)

        return () => {
            window.removeEventListener("keyup", closeFn)
        }
    }, [isOpen])

    let resizeRef = useRef<HTMLDivElement | null>(null)
    let isDragging = useRef(false)
    let startingX = useRef(-1)
    let startingWidth = useRef(-1)

    let onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        ;(e.target as HTMLDivElement).setPointerCapture(e.pointerId)

        if (resizeRef.current) {
            let boundingRect = resizeRef.current.getBoundingClientRect()
            startingWidth.current = boundingRect.width
            isDragging.current = true
            startingX.current = e.clientX
        }
    }, [])

    let onPointerCancel = useCallback(() => {
        isDragging.current = false
    }, [])

    let onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging.current || !resizeRef.current) {
            return
        }

        resizeRef.current.style.width = `${startingWidth.current + (startingX.current - e.clientX)}px`
    }, [])

    return (
        <div className={clsx("devtools", { "is-open": isOpen })}>
            <button
                className="devtools-open-btn"
                type="button"
                onClick={() => setIsOpen(true)}
                tabIndex={0}
            >
                <FlaskIcon />
            </button>

            {isOpen && (
                <div
                    className="devtools-panels-positioner"
                    tabIndex={-1}
                    ref={resizeRef}
                >
                    <div className="devtools-panels" tabIndex={-1}>
                        <div
                            className="devtools-panels-resizer"
                            onPointerDown={onPointerDown}
                            onPointerCancel={onPointerCancel}
                            onPointerUp={onPointerCancel}
                            onPointerMove={onPointerMove}
                        />

                        <nav className="devtools-panel-list">
                            {Object.keys(tabs).map((tabname) => (
                                <button
                                    key={tabname}
                                    type="button"
                                    className={clsx(
                                        "devtools-panel-list-item",
                                        { active: tabname === activeTab },
                                    )}
                                    tabIndex={0}
                                    onClick={() =>
                                        startTransition(() => {
                                            if (
                                                isOpen &&
                                                tabname === activeTab
                                            ) {
                                                setIsOpen(false)
                                                return
                                            }

                                            setIsOpen(true)
                                            setActiveTab(
                                                tabname as keyof typeof tabs,
                                            )
                                        })
                                    }
                                >
                                    {tabname}
                                </button>
                            ))}

                            <div className="flex-1 flex justify-end">
                                <button
                                    className="devtools-close-btn"
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    tabIndex={0}
                                >
                                    <XIcon />
                                </button>
                            </div>
                        </nav>

                        <div className="devtools-panel">
                            <Suspense key={activeTab} fallback={<Loader />}>
                                {tabs[activeTab]}
                            </Suspense>
                        </div>
                    </div>
                </div>
            )}

            <FPSMeter />
        </div>
    )
}
