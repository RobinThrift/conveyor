import * as HoverCard from "@radix-ui/react-hover-card"
import clsx from "clsx"
import React from "react"

export interface LinkPreviewProps {
    className?: string
    children: string
    img: string
    title: string
    description: string
    alt?: string
}

export function LinkPreview(props: LinkPreviewProps) {
    if (!props.img && !props.description) {
        return (
            <a
                href={props.children}
                target={props.title}
                rel="noreferrer noopener"
            >
                {props.title}
            </a>
        )
    }

    if (!props.img) {
        return (
            <HoverCard.Root>
                <HoverCard.Trigger asChild>
                    <a
                        href={props.children}
                        target={props.title}
                        rel="noreferrer noopener"
                    >
                        {props.title}
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
            >
                <span>{props.title ?? props.children}</span>
                <img src={props.img} alt={props.alt || props.title} />
            </a>

            <div className="description">{props.description}</div>
        </div>
    )
}
