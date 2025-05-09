import React, { useEffect, useState } from "react"
export function FPSMeter() {
    let [fps, setFps] = useState<number>(0)

    useEffect(() => {
        let intervalID = setInterval(() => {
            setFps(currFPS())
        }, 200)

        return () => clearInterval(intervalID)
    }, [])

    return (
        <div className="bg-[var(--btn-bg)]/70 backdrop-blur-xs text-sm py-1! px-2! h-fit rounded-full text-[var(--btn-color)] select-none pointer-events-none">
            <FPSDisplay fps={fps} />
        </div>
    )
}

function FPSDisplay({ fps }: { fps: number }) {
    let color = "var(--color-success-extra-light)"

    if (fps < 30) {
        color = "var(--color-danger-light)"
    } else if (fps < 55) {
        color = "var(--color-danger-extra-light)"
    }

    return (
        <span>
            <span style={{ color }}>{fps}</span>
            {" FPS"}
        </span>
    )
}

let fps = -1
let lastTime = performance.now()
let frameCount = 0

function currFPS() {
    if (fps < 0) {
        updateFPS()
        fps = 60
    }

    return fps
}

function updateFPS() {
    frameCount++
    let now = performance.now()
    if (now - lastTime >= 1000) {
        fps = frameCount
        frameCount = 0
        lastTime = now
    }
    requestAnimationFrame(updateFPS)
}
