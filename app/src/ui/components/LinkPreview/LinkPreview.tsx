import clsx from "clsx"
import React from "react"

import { ZoomableImage } from "@/ui/components/Image"

export interface LinkPreviewProps {
    className?: string
    children: React.ReactNode | React.ReactNode[]
}

export const LinkPreview = React.memo(function LinkPreview(props: LinkPreviewProps) {
    let link: React.ReactNode | undefined
    let img: React.ReactNode | undefined
    let rest: React.ReactNode[] = []

    React.Children.forEach(props.children, (c) => {
        let extract = (cc: typeof c) => {
            if (!cc) {
                return
            }

            if (!(typeof cc === "object")) {
                rest.push(cc)
                return
            }

            let el = cc as React.ReactElement

            if (el.type === "p") {
                React.Children.forEach((el.props as React.HTMLProps<"p">).children, extract)
                return
            }

            if (el.type === React.Fragment) {
                React.Children.forEach((el.props as React.FragmentProps).children, extract)
                return
            }

            if (el.type === React.Suspense) {
                let hasImg = false
                React.Children.forEach((el.props as React.SuspenseProps).children, (ccc) => {
                    if (
                        ccc &&
                        typeof ccc === "object" &&
                        "type" in ccc &&
                        ccc.type === ZoomableImage
                    ) {
                        hasImg = true
                    }
                })

                if (hasImg) {
                    img = el
                } else {
                    rest.push(el)
                }
                return
            }

            if (el.type === "a") {
                link = <h3 className="link-preview-title">{el}</h3>
                return
            }

            if (el.type === "h1" && !link) {
                link = el
                return
            }

            if (el.type === ZoomableImage) {
                img = el
                return
            }

            rest.push(el)
        }

        extract(c)
    })

    if (!img && rest.length === 0) {
        return link
    }

    return (
        <div className={clsx("link-preview", props.className)}>
            {link}
            {img && (
                <ZoomableImage.Context value={false}>
                    <div className="preview-img">{img}</div>{" "}
                </ZoomableImage.Context>
            )}
            <div className="link-preview-description">{rest}</div>
        </div>
    )
})
