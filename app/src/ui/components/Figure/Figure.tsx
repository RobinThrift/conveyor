import React from "react"
import Zoom from "react-medium-image-zoom"
import "react-medium-image-zoom/dist/styles.css"

import { XIcon } from "@/ui/components/Icons"
import { Image } from "@/ui/components/Image"

export interface FigureProps {
    className?: string
    id?: string
    alt: string
    src: string
    caption?: string
}

export function Figure(props: FigureProps) {
    return (
        <figure id={props.id} className={props.className}>
            <Zoom IconUnzoom={() => <XIcon />} classDialog="image-zoom">
                <Image src={props.src} alt={props.alt} />
                <figcaption>{props.caption ?? props.alt}</figcaption>
            </Zoom>
        </figure>
    )
}
