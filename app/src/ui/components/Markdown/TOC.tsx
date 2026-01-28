import clsx from "clsx"
import React, { type CSSProperties, useEffect, useMemo, useRef } from "react"

import { buildTOC, parse, type TOCItem as TOCItemT } from "@/lib/markdown"
import { useT } from "@/ui/i18n"

export function TOC({
    className,
    document,
    id,
}: {
    className?: string
    document: string
    id: string
}) {
    let t = useT("components/Memo/TOC")
    let toc = useMemo(() => {
        let [ast, _] = parse(document)
        if (!ast) {
            return
        }

        return buildTOC({ ast: ast, documentID: id, document })
    }, [document, id])

    let { ref } = useTOCState(toc ?? [])

    if (!toc) {
        return
    }

    return (
        <ol ref={ref} className={clsx("toc", className)} aria-label={t.Label}>
            {toc.map((item) => (
                <TOCItem key={item.id} item={item} />
            ))}
        </ol>
    )
}

function TOCItem({ item }: { item: TOCItemT }) {
    return (
        <li className="toc-item">
            <a href={`#${item.id}`} data-heading-id={item.id} title={item.label}>
                {item.label}
            </a>
            {item.items.length > 0 ? (
                <ol
                    className="toc-items"
                    style={{ "--toc-indent-level": item.level } as CSSProperties}
                >
                    {item.items.map((subitem) => (
                        <TOCItem key={subitem.id} item={subitem} />
                    ))}
                </ol>
            ) : null}
        </li>
    )
}

function useTOCState(toc: TOCItemT[]) {
    let ref = useRef<HTMLOListElement | null>(null)

    useEffect(() => {
        if (toc.length === 0) {
            return
        }

        let findIds = (items: TOCItemT[]): string[] =>
            items.flatMap((i) => [i.id, ...findIds(i.items)])

        let ids = findIds(toc)

        let currentHeading: Element | undefined
        let highestUp = Number.POSITIVE_INFINITY

        let observer = new IntersectionObserver(
            (entries) => {
                for (let entry of entries) {
                    if (entry.intersectionRatio !== 1 && entry.target === currentHeading) {
                        highestUp = Number.POSITIVE_INFINITY
                        continue
                    }

                    if (entry.intersectionRatio === 1 && entry.boundingClientRect.top < highestUp) {
                        currentHeading = entry.target
                        highestUp = entry.boundingClientRect.top
                    }
                }

                ref.current?.querySelectorAll(".toc-item>a")?.forEach((el) => {
                    let anchor = el as HTMLElement
                    if (anchor.dataset.headingId === currentHeading?.id) {
                        anchor.classList.add("active")
                    } else {
                        anchor.classList.remove("active")
                    }
                })
            },
            {
                threshold: Array.from({ length: 1000 }, (_, i) => i / 1000),
                rootMargin: "0px 0px -80% 0px",
            },
        )

        for (let id of ids) {
            let el = document.querySelector(`.memo-tab-panel-memo #${id}`)
            if (!el) {
                continue
            }

            observer.observe(el)
        }

        return () => observer.disconnect()
    }, [toc])

    return { ref }
}
