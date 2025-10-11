import clsx from "clsx"
import React from "react"

import { XIcon } from "@/ui/components/Icons"
import { usePreventScroll } from "@/ui/hooks/usePreventScroll"
import { useT } from "@/ui/i18n"

import { useDraggableZoomableImage, useZoomableImage } from "./useZoomableImage"

export interface ZoomableImageProps {
    className?: string
    id?: string
    alt: string
    src: string
    caption?: string
}

export function ZoomableImage(props: ZoomableImageProps) {
    let t = useT("components/ZoomableImage")
    let { ref, dialogRef, zoomedImgRef, imgRef, isZoomed, close, onClickZoom, img } =
        useZoomableImage(props)

    return (
        <div
            id={props.id}
            ref={ref}
            className={clsx("zoomable-image-wrapper", { "is-zoomed": isZoomed }, props.className)}
        >
            <button
                type="button"
                aria-label={t.ZoomButtonLabel}
                className="zoom-btn"
                onClick={onClickZoom}
            >
                <img
                    ref={imgRef}
                    src={img.src}
                    alt={props.alt}
                    loading="lazy"
                    className={clsx("zoomable-image", {
                        "animate-pulse": img.isLoading,
                    })}
                    style={img.style}
                />
            </button>

            <dialog ref={dialogRef} className="zoomed-img">
                {isZoomed && (
                    <DraggableZoomableImage
                        {...props}
                        src={img.src ?? props.src}
                        isLoading={img.isLoading}
                        style={img.style}
                        close={close}
                        ref={zoomedImgRef}
                    />
                )}
            </dialog>
        </div>
    )
}

const DraggableZoomableImage = React.memo(function DraggableZoomableImage({
    close,
    ref,
    ...props
}: {
    alt: string
    src: string
    caption?: string
    isLoading?: boolean
    style?: React.CSSProperties

    close: (fromRect?: { x: number; y: number; width: number; height: number }) => void
    ref: React.RefObject<HTMLDivElement | null>
}) {
    let t = useT("components/ZoomableImage")
    let { onPointerDown, onPointerCancel, onPointerMove, onDragStart, onClickClose } =
        useDraggableZoomableImage({ ref, close })

    usePreventScroll()

    return (
        <>
            <button
                type="button"
                aria-label={t.CloseButtonLabel}
                className="zoomed-img-close-btn"
                onClick={onClickClose}
            >
                <XIcon />
            </button>
            {/** biome-ignore lint/a11y/noStaticElementInteractions: this is okay for this use case */}
            <div
                className="zoomed-img-wrapper"
                onDragStart={onDragStart}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerCancel}
                onPointerMove={onPointerMove}
                onPointerCancel={onPointerCancel}
                ref={ref}
                style={{
                    viewTransitionName: "zoomed-image",
                }}
            >
                <img
                    src={props.src}
                    alt={props.alt}
                    loading="eager"
                    className={clsx({
                        "animate-pulse": props.isLoading,
                    })}
                    style={props.style}
                />
            </div>
        </>
    )
})
