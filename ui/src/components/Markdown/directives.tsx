import clsx from "clsx"
import React from "react"

export const directives: Record<string, React.FC<any>> = {
    "open-graph-link": (props: {
        className?: string
        children: string
        img: string
        title: string
        description: string
        alt?: string
    }) => {
        return (
            <figure
                className={clsx(
                    "open-graph-preview not-prose",
                    props.className,
                )}
            >
                <a href={props.children} target={props.title}>
                    <img src={props.img} alt={props.alt || props.title} />
                </a>
                <caption>
                    <h5>
                        <a href={props.children} target={props.title}>
                            {props.title}
                        </a>
                    </h5>
                    <p>
                        <a href={props.children} target={props.title}>
                            {props.description}
                        </a>
                    </p>
                </caption>
            </figure>
        )
    },

    details: (
        props: React.PropsWithChildren<{ summary: string; className?: string }>,
    ) => {
        return (
            <details className={props.className}>
                <summary>{props.summary}</summary>
                {props.children}
            </details>
        )
    },
}
