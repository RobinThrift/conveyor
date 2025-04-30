import * as HoverCard from "@radix-ui/react-hover-card"
import clsx from "clsx"
import React, { useCallback, useEffect, useState } from "react"

import { ArrowUpRightIcon } from "@/ui/components/Icons"
import { Image } from "@/ui/components/Image"

export interface LinkPreviewProps {
    className?: string
    children: string
    img: string
    title: string
    description: string
    alt?: string
}

export const LinkPreview = React.memo(function LinkPreview(
    props: LinkPreviewProps,
) {
    let [imgHasError, setImgHasError] = useState(false)
    let onImgError = useCallback(() => {
        setImgHasError(true)
    }, [])

    // biome-ignore lint/correctness/useExhaustiveDependencies: intentional extra dependency
    useEffect(() => {
        setImgHasError(false)
    }, [props.img])

    if (!props.img && !props.description) {
        return (
            <a
                href={props.children}
                target={props.title}
                rel="noreferrer noopener"
            >
                {props.title}
                <ArrowUpRightIcon className="inline ms-0.5" />
            </a>
        )
    }

    if (!props.img || imgHasError) {
        return (
            <HoverCard.Root>
                <HoverCard.Trigger asChild>
                    <a
                        href={props.children}
                        target={props.title}
                        rel="noreferrer noopener"
                    >
                        {props.title}
                        <ArrowUpRightIcon className="inline ms-0.5" />
                    </a>
                </HoverCard.Trigger>
                <HoverCard.Portal>
                    <HoverCard.Content
                        className="link-preview-hover-card"
                        sideOffset={5}
                    >
                        {props.description}
                        <HoverCard.Arrow className="link-preview-hover-card-arrow" />
                    </HoverCard.Content>
                </HoverCard.Portal>
            </HoverCard.Root>
        )
    }

    return (
        <div className={clsx("link-preview not-prose", props.className)}>
            <a
                href={props.children}
                target={props.title}
                className="preview-img"
                rel="noreferrer noopener"
            >
                <Image
                    src={props.img}
                    alt={props.alt || props.title}
                    onError={onImgError}
                />
            </a>
            <div className="description-container">
                <div className="description content">
                    {props.title && <h4>{props.title}</h4>}
                    <p>{props.description}</p>
                </div>
            </div>

            <a
                href={props.children}
                target={props.title}
                rel="noreferrer noopener"
                className="arrow"
            >
                <ArrowUpRightIcon weight="bold" />
            </a>
        </div>
    )
})
