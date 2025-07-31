import clsx from "clsx"
import React, { useCallback, useEffect, useState } from "react"

import { ArrowUpRightIcon } from "@/ui/components/Icons"
import { Image } from "@/ui/components/Image"
import { InfoPopover } from "@/ui/components/InfoPopover"

export interface LinkPreviewProps {
    className?: string
    children: string
    img: string
    title: string
    description: string
    alt?: string
}

export const LinkPreview = React.memo(function LinkPreview(props: LinkPreviewProps) {
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
            <a href={props.children} target={props.title} rel="noreferrer noopener">
                {props.title}
                <ArrowUpRightIcon className="inline ms-0.5" />
            </a>
        )
    }

    if (!props.img || imgHasError) {
        return (
            <>
                <a href={props.children} target={props.title} rel="noreferrer noopener">
                    {props.title}
                    <ArrowUpRightIcon className="inline ms-0.5" />
                </a>
                <InfoPopover
                    aria-label="Link Description"
                    buttonClassName="p-0.5 ms-0.5 top-1 relative"
                >
                    {props.description}
                </InfoPopover>
            </>
        )
    }

    return (
        <div className={clsx("link-preview not-prose", props.className)}>
            {/** biome-ignore lint/a11y/useAnchorContent: this should be skipped by screen readers to prevent double tabbing  */}
            <a
                href={props.children}
                target={props.title}
                className="preview-img"
                aria-hidden="true"
                tabIndex={-1}
            >
                <Image src={props.img} alt={props.alt || props.title} onError={onImgError} />
            </a>

            {props.title && (
                <a
                    className="link-preview-title"
                    href={props.children}
                    target={props.title}
                    rel="noreferrer noopener"
                    aria-label={props.title}
                >
                    {props.title}
                </a>
            )}

            <div className="link-preview-description content">
                <p>{props.description}</p>
            </div>
        </div>
    )
})
