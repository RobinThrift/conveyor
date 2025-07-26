import clsx from "clsx"
import React, { useRef } from "react"
import { useImageState } from "./useImageState"

export interface ImageProps {
    className?: string
    src: string
    alt: string
    loading?: "lazy" | "eager"
    onError?: () => void
    style?: React.CSSProperties
}

export const Image = React.memo(function Image(props: ImageProps) {
    let ref = useRef<HTMLImageElement | null>(null)
    let { src, isLoading, style } = useImageState({
        ref,
        ...props,
    })

    return (
        <img
            ref={ref}
            src={src}
            alt={props.alt}
            loading={props.loading ?? "lazy"}
            onError={props.onError}
            className={clsx(
                {
                    "animate-pulse": isLoading,
                },
                props.className,
            )}
            style={style}
        />
    )
})
