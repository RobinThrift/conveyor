import clsx from "clsx"
import React, { type CSSProperties, useMemo } from "react"

import { buildTOC, parse, type TOCItem as TOCItemT } from "@/lib/markdown"

export function TOC({
    className,
    document,
    id,
}: {
    className?: string
    document: string
    id: string
}) {
    let toc = useMemo(() => {
        let [ast, _] = parse(document)
        if (!ast) {
            return
        }

        return buildTOC({ ast: ast, documentID: id, document })
    }, [document, id])

    if (!toc) {
        return
    }

    return (
        <ul className={clsx("toc", className)}>
            {toc.map((item) => (
                <TOCItem key={item.id} item={item} />
            ))}
        </ul>
    )
}

function TOCItem({ item }: { item: TOCItemT }) {
    return (
        <li className="toc-item">
            <a href={`#${item.id}`}>{item.label}</a>
            {item.items.length > 0 ? (
                <ul
                    className="toc-items"
                    style={{ "--toc-indent-level": item.level } as CSSProperties}
                >
                    {item.items.map((subitem) => (
                        <TOCItem key={subitem.id} item={subitem} />
                    ))}
                </ul>
            ) : null}
        </li>
    )
}
