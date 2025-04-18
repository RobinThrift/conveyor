import React, {
    startTransition,
    useCallback,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
} from "react"

import { newID } from "@/domain/ID"
import { CaretDownIcon } from "@/ui/components/Icons"
import { Code } from "@/ui/components/Markdown/Code"

export function SQLLogDevTool() {
    let ref = useRef<HTMLDivElement | null>(null)
    let [autoScrollEnabled, setAutoScrollEnabled] = useState(true)
    let events = useSyncExternalStore(_sqlllog_subscribe, _sqlllog_getSnapshot)

    useEffect(() => {
        let current = ref.current
        if (!current) {
            return
        }
        let offsetParent = current?.parentElement
        if (!offsetParent) {
            return
        }

        let onScroll = () => {
            startTransition(() => {
                setAutoScrollEnabled(
                    current.offsetHeight - offsetParent.clientHeight ===
                        offsetParent.scrollTop,
                )
            })
        }
        offsetParent.addEventListener("scroll", onScroll)

        return () => {
            offsetParent.removeEventListener("scroll", onScroll)
        }
    }, [])

    // biome-ignore lint/correctness/useExhaustiveDependencies: intentional change when event list changes
    useEffect(() => {
        let current = ref.current
        let offsetParent = current?.parentElement
        if (current && offsetParent && autoScrollEnabled) {
            offsetParent.scrollTo({
                left: 0,
                top: current.clientHeight,
                behavior: "smooth",
            })
        }
    }, [autoScrollEnabled, events.length])

    let onClickToBottomButton = useCallback(() => {
        let current = ref.current
        let offsetParent = current?.parentElement
        if (current && offsetParent) {
            offsetParent.scrollTo(0, current.clientHeight)
        }
    }, [])

    return (
        <div
            className="dark bg-body min-h-full w-full relative overscroll-contain"
            ref={ref}
        >
            <header className="sticky top-0 left-0 right-0 p-2 text-xl font-mono text-text backdrop-blur-sm">
                SQL Log
            </header>
            <ul className="divide-y divide-subtle">
                {events.map(({ id, event, args = [] }) => (
                    <li key={id} className="p-4 hover:bg-surface-level-1">
                        <h3 className="text-subtle-light font-mono">{event}</h3>
                        {args[0] && (
                            <Code
                                className="dark rosepine rounded p-2 my-2 text-wrap"
                                lang="sql"
                            >
                                {args[0]}
                            </Code>
                        )}
                        {args[1] && (
                            <Code
                                className="dark rosepine rounded p-2 my-2 text-wrap"
                                lang="json"
                            >
                                {JSON.stringify(args[1], undefined, 4)}
                            </Code>
                        )}
                    </li>
                ))}
            </ul>

            <button
                type="button"
                aria-label="scroll to bottom"
                onClick={onClickToBottomButton}
                className="fixed p-3 bg-primary/70 hover:bg-primary bottom-4 right-4 flex items-center justify-center rounded-full text-primary-contrast cursor-pointer backdrop-blur-sm"
            >
                <CaretDownIcon size={28} />
            </button>
        </div>
    )
}

SQLLogDevTool.update = () => {}

declare global {
    interface Window {
        __SQLLOG__LOG__: (event: string, args?: any) => void
        __SQLLOG__: { id: string; event: string; args?: any }[]
    }
}

window.__SQLLOG__ = window.__SQLLOG__ ?? []
window.__SQLLOG__LOG__ =
    window.__SQLLOG__LOG__ ??
    ((event: string, args?: any) => {
        window.__SQLLOG__ = [...window.__SQLLOG__, { id: newID(), event, args }]
    })

function _sqlllog_subscribe(
    callback: (events: { id: string; event: string; args?: any }[]) => void,
) {
    let original = window.__SQLLOG__LOG__

    window.__SQLLOG__LOG__ = (event: string, args?: any) => {
        original(event, args)
        callback(window.__SQLLOG__)
    }

    callback(window.__SQLLOG__)

    return () => {
        window.__SQLLOG__LOG__ = original
    }
}

function _sqlllog_getSnapshot() {
    return window.__SQLLOG__
}
