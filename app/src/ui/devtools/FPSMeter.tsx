import React, { useEffect, useState } from "react"
export function FPSMeter() {
    let [history, setHistory] = useState<{ ts: number; value: number }[]>([
        { ts: performance.now(), value: 0 },
    ])
    let [maxFPS, setMaxFPS] = useState<number>(0)
    let [fps, setFps] = useState<number>(0)

    useEffect(() => {
        let intervalID = setInterval(() => {
            let fps = currFPS()
            setHistory((history) => {
                if (history.length >= 10) {
                    history.shift()
                }

                return [...history, { ts: performance.now(), value: fps }]
            })

            setMaxFPS((maxFPS) => {
                if (fps > maxFPS) {
                    return fps
                }
                return maxFPS
            })

            setFps(fps)
        }, 200)

        return () => clearInterval(intervalID)
    }, [])

    return (
        <div
            className="bg-[var(--btn-bg)]/70 backdrop-blur-xs text-sm py-1! px-2! h-fit rounded-full text-[var(--btn-color)] select-none pointer-events-none flex items-center gap-2"
            title={`MaxFPS: ${maxFPS}`}
        >
            <div className="flex justify-end items-end h-[1lh] w-10">
                {history.map(({ ts, value }) => (
                    <div
                        key={ts}
                        className="w-1 bg-white first:rounded-l last:rounded-r"
                        style={{
                            height: `${(value / maxFPS) * 100}%`,
                        }}
                    />
                ))}
            </div>
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
        <span className="font-mono">
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
