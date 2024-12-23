import { useT } from "@/i18n"
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react"
import { animated, config, useSpring } from "@react-spring/web"
import { useDrag } from "@use-gesture/react"
import React, { useRef } from "react"

export function FilterOverlay(props: React.PropsWithChildren) {
    let height = globalThis.innerHeight
    let [{ y }, api] = useSpring(() => ({ y: height, config: { clamp: true } }))

    let open = ({ canceled = false }: { canceled?: boolean } = {}) => {
        api.start({
            y: 0,
            immediate: false,
            config: canceled ? config.wobbly : config.stiff,
        })
    }

    let close = (velocity = 0) => {
        api.start({
            y: height,
            immediate: false,
            config: { ...config.stiff, velocity },
        })
    }

    let ref = useRef<HTMLButtonElement | null>(null)

    useDrag(
        ({
            last,
            velocity: [, vy],
            direction: [, dy],
            offset: [, offsetY],
            cancel,
            canceled,
        }) => {
            if (offsetY < -70 || offsetY > height) {
                cancel()
            }

            if (last) {
                if (offsetY > height * 0.8 || (vy > 0.5 && dy > 0)) {
                    close(Math.min(vy, 2)) // limit speed top prevent stutter
                } else {
                    open({ canceled })
                }

                return
            }

            api.start({ y: offsetY, immediate: true })
        },
        {
            from: () => [0, y.get()],
            filterTaps: true,
            axis: "y",
            pointer: { touch: true },
            target: ref,
            rubberband: false,
        },
    )

    let style = {
        transform: y.to(
            [0, height],
            ["translateY(0dvh)", "translateY(100dvh)"],
        ),
        touchAction: y.to((py) => (py >= height ? "auto" : "none")),
    }

    return (
        <>
            <FilterOverlayFAB onClick={open} />
            <animated.div className="filter-overlay" style={style}>
                <button
                    ref={ref}
                    className="drag-handle"
                    type="button"
                    onClick={() => close()}
                >
                    <CaretDown size={24} />
                </button>

                <div className="filter-overlay-body">{props.children}</div>
            </animated.div>
        </>
    )
}

function FilterOverlayFAB({ onClick }: { onClick: () => void }) {
    let t = useT("pages/ListMemos")

    return (
        <button
            type="button"
            className="filter-overlay-fab"
            aria-label={t.OpenFilterOverlayButtonLabel}
            onClick={onClick}
        >
            <MagnifyingGlass weight="bold" />
        </button>
    )
}
