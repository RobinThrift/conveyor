import clsx from "clsx"
import React from "react"

export interface ConveyorBeltTextProps {
    className?: string
    start: string
    middle: string
    end: string
}

const isUpperCaseOrNumberPattern = /\p{Lu}|\d/u

export function ConveyorBeltText(props: ConveyorBeltTextProps) {
    let lineHeight = {
        "--conveyor-belt-text-line-height":
            "var(--conveyor-belt-text-lowercase-line-height)",
    }
    if (isUpperCaseOrNumberPattern.test(props.middle)) {
        lineHeight = {
            "--conveyor-belt-text-line-height":
                "var(--conveyor-belt-text-uppercase-line-height)",
        }
    }

    return (
        <div
            className={clsx("conveyor-belt-text", props.className)}
            aria-valuetext={`${props.start}${props.middle}${props.end}`}
            style={lineHeight as any}
        >
            <span className="conveyor-belt-text-middle">
                {props.middle.repeat(16)}
            </span>
            <span>
                {props.start}
                <em>{props.middle}</em>
                {props.end}
            </span>
        </div>
    )
}
