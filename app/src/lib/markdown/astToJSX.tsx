import type { SyntaxNode, SyntaxNodeRef, Tree } from "@lezer/common"
import clsx from "clsx"
import React, { type Key, type ReactNode, Suspense } from "react"
import type { Params, Screens } from "@/control/NavigationController"
import { CheckIcon } from "@/ui/components/Icons"
import { Loader } from "@/ui/components/Loader"
import { useT } from "@/ui/i18n"

interface Document {
    id: string
    text: string
    footnotes: React.ReactNode[]
    componentMap: ComponentMap
    customBlocks: CustomBlocks
}

interface ComponentMap {
    Alert?: React.ComponentType<React.PropsWithChildren<{ variant: "danger" }>>
    Code?: React.ComponentType<{
        lang?: string
        meta?: string
        children: string
    }>
    Link?: React.ComponentType<
        React.AnchorHTMLAttributes<any> & {
            screen?: keyof Screens
            params?: Params[keyof Screens]
        }
    >
    Image?: React.ComponentType<{
        className?: string
        id?: string
        alt: string
        src: string
        caption?: string
    }>
    FootnoteReturnIcon?: React.ComponentType
    TagLink?: React.ComponentType<{ tag: string; className?: string }>
}

type CustomBlocks = Record<string, React.ComponentType<React.PropsWithChildren>>

export function astToJSX(
    ast: Tree,
    documentID: string,
    document: string,
    opts: { componentMap?: ComponentMap; customBlocks?: CustomBlocks } = {},
): ReactNode[] {
    let doc: Document = {
        id: documentID,
        text: document,
        footnotes: [],
        componentMap: opts.componentMap ?? {},
        customBlocks: opts.customBlocks ?? {},
    }

    let nodes: ReactNode[] = []

    ast.iterate({
        enter: (cursor) => {
            if (cursor.name === "Document") {
                return
            }

            nodes.push(astNodeToJSX(doc, cursor.node))
            return false
        },
    })

    if (doc.footnotes.length !== 0) {
        nodes.push(
            <React.Fragment key="footnotes">
                <div className="footnotes" role="doc-endnotes">
                    <ol>{doc.footnotes}</ol>
                </div>
            </React.Fragment>,
        )
    }

    return nodes
}

function astNodeToJSX(doc: Document, cursor: SyntaxNodeRef, stripParagraph?: boolean): ReactNode {
    switch (cursor.type.name) {
        case "ATXHeading1":
            return headingToJSX(doc, cursor.node, 1)
        case "SetextHeading2":
        case "ATXHeading2":
            return headingToJSX(doc, cursor.node, 2)
        case "ATXHeading3":
            return headingToJSX(doc, cursor.node, 3)
        case "ATXHeading4":
            return headingToJSX(doc, cursor.node, 4)
        case "ATXHeading5":
            return headingToJSX(doc, cursor.node, 5)
        case "ATXHeading6":
            return headingToJSX(doc, cursor.node, 6)
        case "Paragraph":
            return paragraphtoJSX(doc, cursor.node, stripParagraph)
        case "BulletList":
            return bulletListToJSX(doc, cursor.node)
        case "OrderedList":
            return orderedListToJSX(doc, cursor.node)
        case "ListItem":
            return listItemToJSX(doc, cursor.node)
        case "Task":
            return taskItemToJSX(doc, cursor.node)
        case "TaskMarker":
            return taskMarkerToJSX(doc, cursor.node)
        case "Blockquote":
            return blockquoteToJSX(doc, cursor.node)
        case "StrongEmphasis":
            return strongToJSX(doc, cursor.node)
        case "Emphasis":
            return emphasisToJSX(doc, cursor.node)
        case "Strikethrough":
            return strikethroughToJSX(doc, cursor.node)
        case "InlineCode":
            return inlineCodeToJSX(doc, cursor.node)
        case "Link":
            return linkToJSX(doc, cursor.node)
        case "URL":
            return urlToJSX(doc, cursor.node)
        case "TagLink":
            return tagLinkToJSX(doc, cursor.node)
        case "FootnoteRef":
            return footnoteRefToJSX(doc, cursor.node)
        case "FootnoteDef":
            return footnoteDefToJSX(doc, cursor.node)
        case "CodeBlock":
        case "FencedCode":
            return fencedCodeToJSX(doc, cursor.node)
        case "Image":
            return imageToJSX(doc, cursor.node)
        case "Table":
            return tableToJSX(doc, cursor.node)
        case "CustomBlock":
            return customBlockToJSX(doc, cursor.node)
        case "HardBreak":
            return <br key={nodeKey(cursor.node)} />
        case "HorizontalRule":
            return <hr key={nodeKey(cursor.node)} />
        case "Escape":
        case "HTMLTag":
        case "Subscript":
            console.debug(
                `need tohandle node ${cursor.type.name}:`,
                doc.id,
                doc.text.substring(cursor.from, cursor.to),
            )
            return null
        case "ListMark":
        case "QuoteMark":
        case "FootnoteMark":
        case "HeaderMark":
        case "CustomBlockEnd":
        case "Escape":
            return null
    }

    throw new Error(`unknown node type ${cursor.type.name}`)
}

function headingToJSX(doc: Document, node: SyntaxNode, level: number): ReactNode {
    let children: ReactNode[] = []

    if (!node.firstChild) {
        children = [doc.text.substring(node.from, node.to).trim()]
    } else {
        children = collectChildren(doc, node)
    }

    let key = nodeKey(node)
    let id = `${doc.id}-${idFromText(doc.text.substring(node.from, node.to))}`
    switch (level) {
        case 1:
            return (
                <h1 key={key} id={id}>
                    {children}
                </h1>
            )
        case 2:
            return (
                <h2 key={key} id={id}>
                    {children}
                </h2>
            )
        case 3:
            return (
                <h3 key={key} id={id}>
                    {children}
                </h3>
            )
        case 4:
            return (
                <h4 key={key} id={id}>
                    {children}
                </h4>
            )
        case 5:
            return (
                <h5 key={key} id={id}>
                    {children}
                </h5>
            )
        case 6:
            return (
                <h6 key={key} id={id}>
                    {children}
                </h6>
            )
    }
}

function paragraphtoJSX(doc: Document, node: SyntaxNode, stripParagraph?: boolean): ReactNode {
    if (!node.firstChild && stripParagraph) {
        return doc.text.substring(node.from, node.to).trim()
    }

    if (stripParagraph) {
        return <React.Fragment key={nodeKey(node)}>{collectChildren(doc, node)}</React.Fragment>
    }

    if (!node.firstChild) {
        return <p key={nodeKey(node)}>{doc.text.substring(node.from, node.to).trim()}</p>
    }

    let images = node.getChildren("Image")
    if (images.length === 0) {
        return <p key={nodeKey(node)}>{collectChildren(doc, node)}</p>
    }

    let nodes: React.ReactNode[] = []
    let after = -1
    let i = 0

    for (let image of images) {
        let children = collectChildren(doc, node, { before: image.from, after })
        nodes.push(<p key={`${nodeKey(node)}-${i}`}>{children}</p>)
        nodes.push(imageToJSX(doc, image))
        after = image.to
        i++
    }

    return <React.Fragment key={nodeKey(node)}>{nodes}</React.Fragment>
}

function strongToJSX(doc: Document, node: SyntaxNode): ReactNode {
    return (
        <strong key={nodeKey(node)}>
            {collectChildren(doc, node, {
                after: node.firstChild?.to,
                before: node.lastChild?.from,
            })}
        </strong>
    )
}

function emphasisToJSX(doc: Document, node: SyntaxNode): ReactNode {
    return (
        <em key={nodeKey(node)}>
            {collectChildren(doc, node, {
                after: node.firstChild?.to,
                before: node.lastChild?.from,
            })}
        </em>
    )
}

function strikethroughToJSX(doc: Document, node: SyntaxNode): ReactNode {
    return (
        <del key={nodeKey(node)}>
            {collectChildren(doc, node, {
                after: node.firstChild?.to,
                before: node.lastChild?.from,
            })}
        </del>
    )
}

function inlineCodeToJSX(doc: Document, node: SyntaxNode): ReactNode {
    return (
        <code key={nodeKey(node)}>
            {collectChildren(doc, node, {
                after: node.firstChild?.to,
                before: node.lastChild?.from,
            })}
        </code>
    )
}

function linkToJSX(doc: Document, node: SyntaxNode): ReactNode {
    let children = node.getChildren("LinkMark")

    let url = ""
    if (children.length > 2) {
        let hrefFrom = children[2].to ?? node.from
        let hrefTo = children[3]?.from ?? node.from

        url = doc.text.substring(hrefFrom, hrefTo)
    }

    if (url.startsWith("#")) {
        url = `#${doc.id}-${url.replace("#", "")}`
    }

    let key = nodeKey(node)

    return (
        <a href={url} key={key} rel="noreferrer noopener" target={key as string}>
            {collectChildren(doc, node, { after: children[0].to, before: children[1].from })}
        </a>
    )
}

function urlToJSX(doc: Document, node: SyntaxNode): ReactNode {
    let url = doc.text.substring(node.from, node.to).trim()
    if (node.parent?.type.name === "Link" || node.parent?.type.name === "Image") {
        return url
    }

    let key = nodeKey(node)

    return (
        <a href={url} key={key} rel="noreferrer noopener" target={key as string}>
            {url}
        </a>
    )
}

function tagLinkToJSX(doc: Document, node: SyntaxNode): ReactNode {
    let TagLink = doc.componentMap.TagLink
    let tag = doc.text.substring(node.from + 1, node.to)

    if (!TagLink) {
        return (
            <span key={nodeKey(node)} className="tag-link">
                #{tag}
            </span>
        )
    }

    return <TagLink tag={tag} key={nodeKey(node)} className="tag-link" />
}

function footnoteRefToJSX(doc: Document, node: SyntaxNode): ReactNode {
    let children = node.getChildren("FootnoteMark")
    let identifier = doc.text.substring(children[0].from + 2, children[1].to - 1)

    return (
        <sup id={`fnref:${doc.id}-${identifier}`} key={nodeKey(node)}>
            <a href={`#fn:${doc.id}-${identifier}`} role="doc-noteref">
                {collectChildren(doc, node)}
            </a>
        </sup>
    )
}

function footnoteDefToJSX(doc: Document, node: SyntaxNode): ReactNode {
    let children = node.getChildren("FootnoteMark")
    let identifier = doc.text.substring(children[0].from + 2, children[1].to - 2)

    doc.footnotes.push(
        <FootnoteLinkItem doc={doc} identifier={identifier} key={nodeKey(node)}>
            {collectChildren(doc, node, {
                after: children[1].to + 1,
            })}
        </FootnoteLinkItem>,
    )
    return null
}

function fencedCodeToJSX(doc: Document, node: SyntaxNode): ReactNode {
    let Code = doc.componentMap.Code ?? "pre"

    let codeInfo = ""
    let codeInfoNode = node.getChild("CodeInfo")

    if (codeInfoNode) {
        codeInfo = doc.text.substring(codeInfoNode.from, codeInfoNode.to)
    }

    let lang = ""

    let langEndIndex = codeInfo.indexOf(" ")
    if (langEndIndex !== -1) {
        lang = codeInfo.substring(0, langEndIndex)
        codeInfo = codeInfo.substring(langEndIndex + 1)
    } else {
        lang = codeInfo
        codeInfo = ""
    }

    let childen = ""

    let codeText = node.getChild("CodeText")
    if (codeText) {
        childen = doc.text.substring(codeText.from, codeText.to)
    }

    return (
        <Code key={nodeKey(node)} lang={lang} meta={codeInfo}>
            {childen}
        </Code>
    )
}

function imageToJSX(doc: Document, node: SyntaxNode): ReactNode {
    let Img = doc.componentMap.Image ?? "img"

    let children = node.getChildren("LinkMark")
    let titleFrom = children[0].to
    let titleTo = children[1].from

    let alt = doc.text.substring(titleFrom ?? 0, titleTo ?? 0)

    let src = ""
    if (children.length > 2) {
        let hrefFrom = children[2].to ?? node.from
        let hrefTo = children[3]?.from ?? node.from

        src = doc.text.substring(hrefFrom, hrefTo)
    }

    let id = `${doc.id}-${idFromText(alt || src)}`

    return (
        <Suspense key={nodeKey(node)} fallback={<Loader />}>
            <Img id={id} src={src} alt={alt} />
        </Suspense>
    )
}

export type Alignment = "none" | "centre" | "left" | "right"

function tableToJSX(doc: Document, node: SyntaxNode): ReactNode {
    let alignmentNode = node.getChild("TableDelimiter", "TableHeader")
    let alignmentText = alignmentNode
        ? doc.text.substring(alignmentNode.from, alignmentNode.to).trim()
        : ""
    let alignmentSpecifiers = alignmentText.substring(1, alignmentText.length - 2).split("|")

    let alignments: Alignment[] = []

    for (let spec of alignmentSpecifiers) {
        let trimmed = spec.trim()
        let hasLeft = trimmed[0] === ":"
        let hasRight = trimmed.at(-1) === ":"
        if (!hasLeft && !hasRight) {
            alignments.push("none")
        }

        if (hasLeft && hasRight) {
            alignments.push("centre")
            continue
        }

        if (hasLeft) {
            alignments.push("left")
            continue
        }

        alignments.push("right")
    }

    let currCol = 0
    let cells: React.ReactNode[] = []
    let rows: React.ReactNode[] = []
    let header: React.ReactNode | null = null

    node.cursor().iterate(
        (c) => {
            if (c.name === "Table") {
                return
            }

            if (c.name === "TableCell") {
                let children: React.ReactNode
                if (!c.node.firstChild) {
                    children = doc.text.substring(c.from, c.to)
                } else {
                    children = collectChildren(doc, c.node)
                }
                cells.push(
                    <td
                        key={nodeKey(c.node)}
                        className={clsx({
                            "text-left": alignments[currCol] === "left",
                            "text-center": alignments[currCol] === "centre",
                            "text-right": alignments[currCol] === "right",
                        })}
                    >
                        {children}
                    </td>,
                )
                return false
            }
        },
        (c) => {
            if (c.name === "TableCell") {
                currCol++
                return
            }

            if (c.name === "TableHeader") {
                header = (
                    <thead key={nodeKey(c.node)}>
                        <tr>{cells}</tr>
                    </thead>
                )
                cells = []
                currCol = 0
                return
            }

            if (c.name === "TableRow") {
                rows.push(<tr key={nodeKey(c.node)}>{cells}</tr>)
                cells = []
                currCol = 0
                return
            }
        },
    )
    return (
        <div key={nodeKey(node)} className="table-wrapper">
            <table>
                {header}
                <tbody>{rows}</tbody>
            </table>
        </div>
    )
}

function bulletListToJSX(doc: Document, node: SyntaxNode): ReactNode {
    return <ul key={nodeKey(node)}>{collectChildren(doc, node)}</ul>
}

function orderedListToJSX(doc: Document, node: SyntaxNode): ReactNode {
    return <ol key={nodeKey(node)}>{collectChildren(doc, node)}</ol>
}

function listItemToJSX(doc: Document, node: SyntaxNode): ReactNode {
    return (
        <li
            key={nodeKey(node)}
            className={clsx({
                "task-list-item": node.firstChild?.nextSibling?.firstChild?.name === "TaskMarker",
            })}
        >
            {collectChildren(doc, node, { stripParagraph: true })}
        </li>
    )
}

function taskItemToJSX(doc: Document, node: SyntaxNode): ReactNode {
    return collectChildren(doc, node, { stripParagraph: true })
}

function taskMarkerToJSX(doc: Document, node: SyntaxNode): ReactNode {
    let isChecked = doc.text.substring(node.from + 1, node.to - 1) === "x"
    let key = nodeKey(node) as string

    return (
        // biome-ignore lint/a11y/useSemanticElements: is valid,as per https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
        <div
            key={key}
            role="checkbox"
            aria-checked={isChecked}
            aria-readonly
            tabIndex={0}
            className="checkbox"
        >
            <CheckIcon />
        </div>
    )
}

function blockquoteToJSX(doc: Document, node: SyntaxNode): ReactNode {
    return <blockquote key={nodeKey(node)}>{collectChildren(doc, node)}</blockquote>
}

function customBlockToJSX(doc: Document, node: SyntaxNode): ReactNode {
    let name = ""
    let nameNode = node.getChild("CustomBlockName")

    if (nameNode) {
        name = doc.text.substring(nameNode.from, nameNode.to)
    }

    let argsNode = node.getChild("CustomBlockArgs")
    let args: any = {}
    if (argsNode) {
        try {
            args = parseCustomBlockArgs(doc.text.substring(argsNode.from, argsNode.to).trim())
        } catch (err) {
            let Alert = doc.componentMap.Alert ?? "div"
            return (
                <Alert variant="danger" key={nodeKey(node)}>
                    {(err as Error).message}
                </Alert>
            )
        }
    }

    let start = node.getChild("CustomBlockStart")
    let end = node.getChild("CustomBlockEnd")

    let CustomBlock = name ? doc.customBlocks[name.trim()] : "div"
    if (!CustomBlock) {
        let Alert = doc.componentMap.Alert ?? "div"
        return (
            <Alert
                variant="danger"
                key={nodeKey(node)}
            >{`Unknown custom block "${node.name}"`}</Alert>
        )
    }
    return (
        <CustomBlock {...args} key={nodeKey(node)}>
            {collectChildren(doc, node, {
                after: argsNode?.to ?? nameNode?.to ?? start?.to,
                before: end?.from,
            })}
        </CustomBlock>
    )
}

function collectChildren(
    doc: Document,
    node: SyntaxNode,
    {
        before = Number.MAX_SAFE_INTEGER,
        after = -1,
        stripParagraph,
    }: { before?: number; after?: number; stripParagraph?: boolean } = {},
): ReactNode[] {
    let children: ReactNode[] = []

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
                appendToChildren(children, doc.text.substring(from, child.from))
            }

            break
        }

        if (child.from !== from) {
            appendToChildren(children, doc.text.substring(from, child.from))
        }

        children.push(astNodeToJSX(doc, child, stripParagraph))

        from = child.to
        child = child.nextSibling
    }

    let to = before < Number.MAX_SAFE_INTEGER ? before : node.to
    let lastChild = child ?? node.lastChild

    if (lastChild && lastChild.to !== to && to < before) {
        appendToChildren(children, doc.text.substring(lastChild.to, to))
    }

    return children
}

function nodeKey(node: SyntaxNode): Key {
    return `${node.name}:${node.from}:${node.to}`
}

function idFromText(...fragements: string[]): string {
    return fragements
        .join("-")
        .normalize()
        .toLowerCase()
        .replaceAll(/\)+/g, "")
        .replaceAll(/[(\s\]\]]+/g, "_")
}

function appendToChildren(children: ReactNode[], node: ReactNode) {
    if (typeof children.at(-1) === "string" && typeof node === "string") {
        children[children.length - 1] += node
    } else {
        children.push(node)
    }
}

function FootnoteLinkItem({
    doc,
    identifier,
    children,
}: React.PropsWithChildren<{ doc: Document; identifier: string }>) {
    let t = useT("components/Memo")
    return (
        <li id={`fn:${doc.id}-${identifier}`}>
            {children}

            <a
                href={`#fnref:${doc.id}-${identifier}`}
                role="doc-backlink"
                aria-label={t.FootnoteBackLink}
                className="ml-1 p-1 relative top-0.5 inline-flex hover:text-primary-contrast hover:bg-primary rounded-sm"
            >
                {doc.componentMap.FootnoteReturnIcon && <doc.componentMap.FootnoteReturnIcon />}
            </a>
        </li>
    )
}

let validArgChars = /[a-zA-Z0-9_]/

function parseCustomBlockArgs(argsStr: string): Record<string, string> {
    let args: Record<string, string> = {}
    if (argsStr.length === 0) {
        return args
    }

    let inQuotes = false
    let isName = true
    let currentName = ""
    let currentVal = ""

    for (let i = 0; i < argsStr.length; i++) {
        if (isName && currentName.length === 0 && argsStr[i] === " ") {
            continue
        }

        if (isName && argsStr[i] === "=") {
            isName = false
            continue
        }

        if (isName && !validArgChars.test(argsStr[i])) {
            throw new Error(`invalid argument name: ${argsStr}`)
        }

        if (isName) {
            currentName += argsStr[i]
            continue
        }

        if (argsStr[i] === '"' && !inQuotes) {
            inQuotes = true
            continue
        }

        if (argsStr[i] === '"' && inQuotes) {
            inQuotes = false
            isName = true
            args[currentName] = currentVal
            currentName = ""
            currentVal = ""
            continue
        }

        if (inQuotes) {
            currentVal += argsStr[i]
            continue
        }

        if (argsStr[i] === " ") {
            isName = true
            args[currentName] = currentVal
            currentName = ""
            currentVal = ""
            continue
        }

        currentVal += argsStr[i]
    }

    if (isName && inQuotes) {
        throw new Error(`invalid arguments: ${argsStr}`)
    }

    if (currentName && currentVal) {
        args[currentName] = currentVal
    }

    return args
}
