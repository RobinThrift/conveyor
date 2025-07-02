import clsx from "clsx"
import React, { useEffect, useRef, useState } from "react"

export interface ConveyorBeltTextProps {
    className?: string
    children: string
    "aria-hidden"?: boolean
}

export function ConveyorBeltText(props: ConveyorBeltTextProps) {
    let ref = useRef<HTMLDivElement>(null)
    let [cssVars, setCSSVars] = useState<React.CSSProperties>(() => {
        return {
            "--conveyor-belt-text-animation-duration": "30s",
        } as React.CSSProperties
    })
    let [text, setText] = useState(props.children)

    useEffect(() => {
        let current = ref.current
        if (!current) {
            return
        }

        let onResize = () => {
            let parentWidth =
                current.parentElement?.getBoundingClientRect().width ??
                current.getBoundingClientRect().width
            let textWidth = current.children[0]?.getBoundingClientRect().width ?? 1

            let ratio = parentWidth / textWidth

            let repeatCount = Math.ceil(ratio) * 2

            setText(props.children.repeat(repeatCount))

            setCSSVars({
                "--conveyor-belt-text-animation-duration": `${ratio * 120}s`,
            } as React.CSSProperties)
        }

        let observer = new ResizeObserver(onResize)
        observer.observe(current)

        return () => {
            observer.disconnect()
        }
    }, [props.children])

    return (
        <div
            className={clsx("conveyor-belt-text-wrapper", props.className)}
            ref={ref}
            style={cssVars}
            aria-hidden={props["aria-hidden"]}
        >
            <div className="conveyor-belt-text">{text}</div>
        </div>
    )
}
