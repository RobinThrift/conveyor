import clsx from "clsx"
import React from "react"

import { XIcon } from "@/ui/components/Icons"
import { usePreventScroll } from "@/ui/hooks/usePreventScroll"
import { useT } from "@/ui/i18n"

import { useDraggableFigure, useFigure } from "./useFigure"

export interface FigureProps {
    className?: string
    id?: string
    alt: string
    src: string
    caption?: string
}

export function Figure(props: FigureProps) {
    let t = useT("components/Figure")
    let { ref, dialogRef, zoomedFigRef, imgRef, isZoomed, close, onClickZoom, img } =
        useFigure(props)

    return (
        <>
            <figure
                id={props.id}
                ref={ref}
                className={clsx("figure", { "is-zoomed": isZoomed }, props.className)}
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
                        className={clsx({
                            "animate-pulse": img.isLoading,
                        })}
                        style={img.style}
                    />
                </button>
                {props.caption && <figcaption>{props.caption}</figcaption>}
            </figure>

            <dialog ref={dialogRef} className="zoomed-img">
                {isZoomed && (
                    <DraggableFigure
                        {...props}
                        src={img.src ?? props.src}
                        isLoading={img.isLoading}
                        style={img.style}
                        close={close}
                        ref={zoomedFigRef}
                    />
                )}
            </dialog>
        </>
    )
}

const DraggableFigure = React.memo(function DraggableFigure({
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
    ref: React.RefObject<HTMLElement | null>
}) {
    let t = useT("components/Figure")
    let { onPointerDown, onPointerCancel, onPointerMove, onDragStart, onClickClose } =
        useDraggableFigure({ ref, close })

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
            <figure
                onDragStart={onDragStart}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerCancel}
                onPointerMove={onPointerMove}
                onPointerCancel={onPointerCancel}
                ref={ref}
                style={{
                    viewTransitionName: "figure-zoomed",
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
                {props.caption && <figcaption>{props.caption}</figcaption>}
            </figure>
        </>
    )
})
