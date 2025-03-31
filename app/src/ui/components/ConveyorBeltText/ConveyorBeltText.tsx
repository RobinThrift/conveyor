import clsx from "clsx"
import React, { useEffect, useRef, useState } from "react"

export interface ConveyorBeltTextProps {
    className?: string
    start: string
    middle: string
    end: string
}

const isUpperCaseOrNumberPattern = /\p{Lu}|\d/u

export function ConveyorBeltText(props: ConveyorBeltTextProps) {
    let [cssVars, setCSSVars] = useState<React.CSSProperties>(() => {
        if (isUpperCaseOrNumberPattern.test(props.middle)) {
            return {
                "--conveyor-belt-text-line-height":
                    "var(--conveyor-belt-text-uppercase-line-height)",
            } as React.CSSProperties
        }

        return {
            "--conveyor-belt-text-line-height":
                "var(--conveyor-belt-text-lowercase-line-height)",
        } as React.CSSProperties
    })
    let ref = useRef<HTMLDivElement>(null)
    let startRef = useRef<HTMLSpanElement>(null)
    let middleRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        if (!ref.current) {
            return
        }

        let cb = () => {
            let cssVars: Record<string, string> = {
                "--conveyor-belt-text-line-height":
                    "var(--conveyor-belt-text-lowercase-line-height)",
            }
            if (isUpperCaseOrNumberPattern.test(props.middle)) {
                cssVars = {
                    "--conveyor-belt-text-line-height":
                        "var(--conveyor-belt-text-uppercase-line-height)",
                }
            }

            if (middleRef.current) {
                let skewYDegrees = 20
                let yRadians = (skewYDegrees * Math.PI) / 180
                let newHeight =
                    middleRef.current.offsetWidth * Math.tan(yRadians)
                let calculatedHeight =
                    middleRef.current.offsetHeight + newHeight

                let skewXDegrees = -10
                let xRadians = (skewXDegrees * Math.PI) / 180
                let newWidth = calculatedHeight * Math.tan(xRadians)
                let calculatedWidth = middleRef.current.offsetWidth + newWidth

                cssVars["--conveyor-belt-text-middle-offset"] =
                    `${middleRef.current.offsetLeft}px`

                cssVars["--conveyor-belt-middle-width"] = `${calculatedWidth}px`
            }

            setCSSVars(cssVars as React.CSSProperties)
        }

        let observer = new ResizeObserver(cb)
        observer.observe(ref.current)
        ref.current.addEventListener("animationstart", cb)

        return () => {
            ref.current?.removeEventListener("animationstart", cb)
            observer.disconnect()
        }
    }, [props.middle])

    return (
        <div
            className={clsx("conveyor-belt-text", props.className)}
            aria-valuetext={`${props.start}${props.middle}${props.end}`}
            style={cssVars}
            ref={ref}
        >
            <span className="conveyor-belt-text-middle">
                {props.middle.repeat(21)}
            </span>
            <span>
                <span ref={startRef}>{props.start}</span>
                <em ref={middleRef}>{props.middle}</em>
                {props.end}
            </span>
        </div>
    )
}
