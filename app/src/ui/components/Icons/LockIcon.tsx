import React from "react"
export function LockIcon({ className }: { className?: string }) {
    return (
        // biome-ignore lint/a11y/noSvgWithoutTitle: is an icon
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 256"
            className={className}
        >
            <rect width="256" height="256" fill="none" />
            <rect
                x="40"
                y="88"
                width="176"
                height="128"
                rx="10"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="16"
                className="lock-body"
                pathLength={1}
            />
            <path
                d="M128 152ZM126 112A28 28 0 01136 166.83V184A8 8 0 01120 184V166.83A28 28 0 01128 112Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="10"
                className="lock-body lock-keyhole"
                pathLength={1}
            />
            <path
                className="lock-bar"
                d="M88,88V56a40,40,0,0,1,80,0V88"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="16"
                pathLength={1}
            />
        </svg>
    )
}
