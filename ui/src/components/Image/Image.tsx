import { X } from "@phosphor-icons/react"
import React from "react"
import Zoom from "react-medium-image-zoom"
import "react-medium-image-zoom/dist/styles.css"

export interface ImageProps {
    className?: string
    id?: string
    alt: string
    src: string
    caption?: string
}

export function Image(props: ImageProps) {
    return (
        <figure id={props.id} className={props.className}>
            <Zoom IconUnzoom={() => <X />} classDialog="image-zoom">
                <img src={props.src} alt={props.alt} loading="lazy" />
                <figcaption>{props.caption ?? props.alt}</figcaption>
            </Zoom>
        </figure>
    )
}
