import React, { useEffect, useState } from "react"

let counter = 0

export function FPSMeter() {
    let [history, setHistory] = useState<{ ts: number; value: number }[]>([
        { ts: performance.now(), value: 0 },
    ])
    let [maxFPS, setMaxFPS] = useState<number>(0)
    let [fps, setFps] = useState<number>(0)

    useEffect(() => {
        let intervalID = setInterval(() => {
            counter++
            let fps = currFPS()
            setHistory((history) => {
                if (history.length >= 10) {
                    history.shift()
                }

                return [...history, { ts: performance.now() + counter, value: fps }]
            })

            setMaxFPS((maxFPS) => {
                if (fps > maxFPS) {
                    return fps
                }
                return maxFPS
            })

            setFps(fps)
        }, 250)

        return () => clearInterval(intervalID)
    }, [])

    return (
        <div className="devtools-fps-meter" title={`MaxFPS: ${maxFPS}`}>
            <div className="fps-meter-barchart">
                {history.map(({ ts, value }) => (
                    <div
                        key={ts}
                        className="fps-meter-bar"
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
        <span className="font-mono" style={{ color }}>
            {fps}
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
