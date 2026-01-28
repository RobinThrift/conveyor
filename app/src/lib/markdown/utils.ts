import type { SyntaxNode } from "@lezer/common"

export function idFromText(...fragements: string[]): string {
    return fragements
        .join("-")
        .normalize()
        .toLowerCase()
        .replaceAll(/[()[`]+/g, "")
        .replaceAll(/[\W]+/giv, "_")
}

export function collectText(
    node: SyntaxNode,
    doc: string,
    {
        before = Number.MAX_SAFE_INTEGER,
        after = -1,
    }: { before?: number; after?: number; stripParagraph?: boolean } = {},
): string {
    if (!node.firstChild) {
        return doc.substring(node.from, node.to).trim()
    }

    let text = ""

    let from = node.from ?? after
    let child: SyntaxNode | null = node.firstChild

    while (child != null) {
        if (child.to <= after) {
            from = child.to
            child = child.nextSibling
            continue
        }

        if (child.from >= before) {
            if (child.from !== from) {
                text += doc.substring(from, child.from)
            }

            break
        }

        if (child.from !== from) {
            text += doc.substring(from, child.from)
        }

        from = child.to
        child = child.nextSibling
    }

    let to = before < Number.MAX_SAFE_INTEGER ? before : node.to
    let lastChild = child ?? node.lastChild

    if (lastChild && lastChild.to !== to && to < before) {
        text += doc.substring(lastChild.to, to)
    }

    return text.trim()
}
