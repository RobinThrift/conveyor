import React, { type Key, type ReactNode } from "react"

import clsx from "clsx"
import type {
    AlignType,
    AutoTagLink,
    BlockContent,
    Blockquote,
    Code as CodeBlock,
    DefinitionContent,
    Delete,
    Emphasis,
    FootnoteDefinition,
    FootnoteReference,
    Heading,
    Image,
    InlineCode,
    Link as LinkNode,
    List,
    ListItem,
    Node,
    Paragraph,
    PhrasingContent,
    Root,
    RootContent,
    Strong,
    Table,
    TableCell,
    TableRow,
} from "mdast"
import type {
    ContainerDirective,
    LeafDirective,
    TextDirective,
} from "mdast-util-directive"

interface Document {
    id: string
    footnotes: React.ReactNode[]
    componentMap: ComponentMap
    directives: Directives
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
            screen: string
            params: any
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
}

type Directives = Record<string, React.ComponentType<React.PropsWithChildren>>

export function astToJSX(
    ast: Root,
    documentID: string,
    opts: { componentMap?: ComponentMap; directives?: Directives } = {},
): ReactNode[] {
    let doc: Document = {
        id: documentID,
        footnotes: [],
        componentMap: opts.componentMap ?? {},
        directives: opts.directives ?? {},
    }

    let nodes: ReactNode[] = [
        ast.children.map((node) => astNodeToJSX(doc, node)),
    ]

    if (doc.footnotes.length !== 0) {
        nodes.push(
            <React.Fragment key="footnotes">
                {/* biome-ignore lint/a11y/useValidAriaRole: false positive */}
                {/* biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: false positive */}
                <div className="footnotes" role="doc-endnotes">
                    <ol>{doc.footnotes}</ol>
                </div>
            </React.Fragment>,
        )
    }

    return nodes
}

function astNodeToJSX(doc: Document, node: RootContent): ReactNode {
    switch (node.type) {
        case "text":
            return node.value
        case "heading":
            return headingToJSX(doc, node)
        case "paragraph":
            return paragraphtoJSX(doc, node)
        case "list":
            return listToJSX(doc, node)
        case "listItem":
            return listItemToJSX(doc, node)
        case "blockquote":
            return blockquoteToJSX(doc, node)
        case "strong":
            return strongToJSX(doc, node)
        case "emphasis":
            return emphasisToJSX(doc, node)
        case "delete":
            return deleteToJSX(doc, node)
        case "inlineCode":
            return inlineCodeToJSX(node)
        case "link":
            return linkToJSX(doc, node)
        case "autoTagLink":
            return autoTagLinkToJSX(doc, node)
        case "image":
            return imageToJSX(doc, node)
        case "code":
            return codeToJSX(doc, node)
        case "table":
            return tableToJSX(doc, node)
        case "footnoteReference":
            return footnoteReferenceToJSX(doc, node)
        case "footnoteDefinition":
            return footnoteDefinitionToJSX(doc, node)
        case "containerDirective":
            return directiveToJSX(doc, node)
        case "leafDirective":
            return directiveToJSX(doc, node)
        case "textDirective":
            return directiveToJSX(doc, node)
        case "break":
            return <br key={nodeKey(node)} />
        case "thematicBreak":
            return <hr key={nodeKey(node)} />
        case "html": {
            let Alert = doc.componentMap.Alert ?? "div"
            return (
                <Alert variant="danger" key={nodeKey(node)}>
                    HTML ist not supported
                </Alert>
            )
        }
    }

    throw new Error(`unknown node type ${node.type}`)
}

function headingToJSX(doc: Document, node: Heading): ReactNode {
    let children = node.children.map((c) => astNodeToJSX(doc, c))
    let key = nodeKey(node)
    let id = `${doc.id}-${idFromText(...extractText(node.children))}`
    switch (node.depth) {
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

function paragraphtoJSX(doc: Document, node: Paragraph): ReactNode {
    let paragraphs: ReactNode[] = []
    let currentParagraphChildren: ReactNode[] = []
    node.children.forEach((c) => {
        if (c.type === "image") {
            if (currentParagraphChildren.length !== 0) {
                paragraphs.push(
                    <p key={`${nodeKey(node)}-${paragraphs.length}`}>
                        {currentParagraphChildren}
                    </p>,
                )
                currentParagraphChildren = []
            }
            paragraphs.push(astNodeToJSX(doc, c))
        } else {
            currentParagraphChildren.push(astNodeToJSX(doc, c))
        }
    })

    if (currentParagraphChildren.length !== 0) {
        paragraphs.push(
            <p key={`${nodeKey(node)}-${paragraphs.length}`}>
                {currentParagraphChildren}
            </p>,
        )
    }

    return paragraphs
}

function listToJSX(doc: Document, node: List): ReactNode {
    let children = node.children.map((c) => astNodeToJSX(doc, c))
    let key = nodeKey(node)
    if (node.ordered) {
        return <ol key={key}>{children}</ol>
    }

    return <ul key={key}>{children}</ul>
}

function listItemToJSX(doc: Document, node: ListItem): ReactNode {
    return (
        <li key={nodeKey(node)}>
            {stripParagraph(node).map((c) => astNodeToJSX(doc, c))}
        </li>
    )
}

function blockquoteToJSX(doc: Document, node: Blockquote): ReactNode {
    return (
        <blockquote key={nodeKey(node)}>
            {stripParagraph(node).map((c) => astNodeToJSX(doc, c))}
        </blockquote>
    )
}

function emphasisToJSX(doc: Document, node: Emphasis): ReactNode {
    return (
        <em key={nodeKey(node)}>
            {node.children.map((c) => astNodeToJSX(doc, c))}
        </em>
    )
}

function deleteToJSX(doc: Document, node: Delete): ReactNode {
    return (
        <del key={nodeKey(node)}>
            {node.children.map((c) => astNodeToJSX(doc, c))}
        </del>
    )
}

function strongToJSX(doc: Document, node: Strong): ReactNode {
    return (
        <strong key={nodeKey(node)}>
            {node.children.map((c) => astNodeToJSX(doc, c))}
        </strong>
    )
}

function inlineCodeToJSX(node: InlineCode): ReactNode {
    return <code key={nodeKey(node)}>{node.value}</code>
}

function linkToJSX(doc: Document, node: LinkNode): ReactNode {
    let url = node.url
    if (url.startsWith("#")) {
        url = `#${doc.id}-${url.replace("#", "")}`
    }

    let key = nodeKey(node)

    return (
        <a
            href={url}
            title={node.title ?? undefined}
            key={key}
            rel="noreferrer noopener"
            target={key as string}
        >
            {node.children.map((c) => astNodeToJSX(doc, c))}
        </a>
    )
}

function autoTagLinkToJSX(doc: Document, node: AutoTagLink): ReactNode {
    let Link = doc.componentMap.Link ?? "a"
    return (
        <Link
            screen="root"
            params={{
                filter: {
                    tag: node.tag,
                },
            }}
            key={nodeKey(node)}
            className="tag-link"
            rel="tag"
        >
            {node.children.map((c) => astNodeToJSX(doc, c))}
        </Link>
    )
}

function imageToJSX(doc: Document, node: Image): ReactNode {
    let Img = doc.componentMap.Image ?? "img"

    let id = `${doc.id}-${idFromText(node.title || node.alt || node.url)}`

    return (
        <Img
            key={nodeKey(node)}
            id={id}
            src={node.url}
            alt={node.alt ?? node.url}
            caption={node.title ?? undefined}
        />
    )
}

function codeToJSX(doc: Document, node: CodeBlock): ReactNode {
    let Code = doc.componentMap.Code ?? "pre"

    return (
        <Code
            key={nodeKey(node)}
            lang={node.lang ?? undefined}
            meta={node.meta ?? undefined}
        >
            {node.value}
        </Code>
    )
}

function tableToJSX(doc: Document, node: Table): ReactNode {
    if (node.children.length === 0) {
        return <table key={nodeKey(node)} />
    }

    let [header, ...rows] = node.children

    let alignments: AlignType[] = node.align || []

    return (
        <div key={nodeKey(node)} className="table-wrapper">
            <table>
                <thead>{tableRowToJSX(doc, header, alignments)}</thead>
                <tbody>
                    {rows.map((row) => tableRowToJSX(doc, row, alignments))}
                </tbody>
            </table>
        </div>
    )
}

function tableRowToJSX(
    doc: Document,
    node: TableRow,
    alignments: AlignType[],
): ReactNode {
    return (
        <tr key={nodeKey(node)}>
            {node.children.map((c, i) => tableCellToJSX(doc, c, alignments[i]))}
        </tr>
    )
}

function tableCellToJSX(
    doc: Document,
    node: TableCell,
    alignment: AlignType,
): ReactNode {
    return (
        <td
            key={nodeKey(node)}
            className={clsx({
                "text-left": alignment === "left",
                "text-center": alignment === "center",
                "text-right": alignment === "right",
            })}
        >
            {node.children.map((c) => astNodeToJSX(doc, c))}
        </td>
    )
}

function footnoteDefinitionToJSX(
    doc: Document,
    node: FootnoteDefinition,
): ReactNode {
    doc.footnotes.push(
        <li id={`fn:${doc.id}-${node.identifier}`} key={nodeKey(node)}>
            {stripParagraph(node).map((c) => astNodeToJSX(doc, c))}

            {/* biome-ignore lint/a11y/useValidAriaRole: false positive */}
            {/* biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: false positive */}
            <a
                href={`#fnref:${doc.id}-${node.identifier}`}
                role="doc-backlink"
                className="ml-1 p-1 relative top-0.5 inline-flex hover:text-primary-contrast hover:bg-primary rounded-sm"
            >
                {doc.componentMap.FootnoteReturnIcon && (
                    <doc.componentMap.FootnoteReturnIcon />
                )}
            </a>
        </li>,
    )
    return null
}

function footnoteReferenceToJSX(
    doc: Document,
    node: FootnoteReference,
): ReactNode {
    return (
        <sup id={`fnref:${doc.id}-${node.identifier}`} key={nodeKey(node)}>
            {/* biome-ignore lint/a11y/useValidAriaRole: false positive */}
            {/* biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: false positive */}
            <a href={`#fn:${doc.id}-${node.identifier}`} role="doc-noteref">
                {node.label}
            </a>
        </sup>
    )
}

function directiveToJSX(
    doc: Document,
    node: ContainerDirective | LeafDirective | TextDirective,
): ReactNode {
    let Directive = doc.directives[node.name]
    if (!Directive) {
        let Alert = doc.componentMap.Alert ?? "div"
        return (
            <Alert
                variant="danger"
                key={nodeKey(node)}
            >{`Unknown directive "${node.name}"`}</Alert>
        )
    }

    let children = node.children.map((c) => astNodeToJSX(doc, c))
    if (node.type === "leafDirective") {
        children = [extractText(node.children).join("")]
    }

    return (
        <Directive {...(node.attributes ?? {})} key={nodeKey(node)}>
            {children}
        </Directive>
    )
}

function stripParagraph(node: {
    children: (BlockContent | DefinitionContent)[]
}): (PhrasingContent | BlockContent | DefinitionContent)[] {
    if (node.children.length === 1) {
        let firstChild = node.children[0]
        if (firstChild.type === "paragraph") {
            return firstChild.children
        }
    }

    return node.children
}

function extractText(content: PhrasingContent[]): string[] {
    let strings: string[] = []
    content.forEach((node) => {
        switch (node.type) {
            case "text":
                strings.push(node.value)
                return
            case "inlineCode":
                strings.push(node.value)
                return
            case "delete":
                strings.push(...extractText(node.children))
                return
            case "strong":
                strings.push(...extractText(node.children))
                return
            case "emphasis":
                strings.push(...extractText(node.children))
                return
            case "link":
                strings.push(...extractText(node.children))
                return
        }
    })

    return strings
}

function idFromText(...fragements: string[]): string {
    return fragements
        .join("-")
        .normalize()
        .toLowerCase()
        .replaceAll(/\)+/g, "")
        .replaceAll(/[(\s\]\]]+/g, "_")
}

function nodeKey(node: Node): Key {
    return `${node.position?.start.line}:${node.position?.start.column}-${node.position?.end.line}:${node.position?.end.column}`
}
