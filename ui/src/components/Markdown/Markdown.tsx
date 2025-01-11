import React, { type Key, type ReactNode, useMemo } from "react"

import { Alert } from "@/components/Alert"
import { Image as ImageComp } from "@/components/Image"
import { Link } from "@/components/Link"
import { ArrowUDownLeft } from "@phosphor-icons/react"
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
import { Code } from "./Code"
import { directives } from "./directives"
import { useMarkdownWorker } from "./useMarkdownWorker"

export interface MarkdownProps {
    children: string
    className?: string
    id: string
    onDoubleClick?: React.MouseEventHandler<HTMLDivElement>
}

export const Markdown = React.forwardRef<HTMLDivElement, MarkdownProps>(
    function Markdown(props, forwardRef) {
        let ast = useMarkdownWorker(props.children)

        let parsed = useMemo(() => {
            if (ast) {
                let ctx: Context = {
                    id: props.id,
                    footnotes: [],
                }

                return astToJSX(ctx, ast)
            }
        }, [ast, props.id])

        return (
            <div
                ref={forwardRef}
                className={clsx("content", props.className)}
                onDoubleClick={props.onDoubleClick}
            >
                {parsed}
            </div>
        )
    },
)

function astToJSX(ctx: Context, ast: Root): ReactNode[] {
    let nodes: ReactNode[] = [
        ast.children.map((node) => astNodeToJSX(ctx, node)),
    ]

    if (ctx.footnotes.length !== 0) {
        nodes.push(
            <React.Fragment key="footnotes">
                {/* biome-ignore lint/a11y/useValidAriaRole: false positive */}
                {/* biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: false positive */}
                <div className="footnotes" role="doc-endnotes">
                    <ol>{ctx.footnotes}</ol>
                </div>
            </React.Fragment>,
        )
    }

    return nodes
}

interface Context {
    id: string
    footnotes: React.ReactNode[]
}

function astNodeToJSX(ctx: Context, node: RootContent): ReactNode {
    switch (node.type) {
        case "text":
            return node.value
        case "heading":
            return headingToJSX(ctx, node)
        case "paragraph":
            return paragraphtoJSX(ctx, node)
        case "list":
            return listToJSX(ctx, node)
        case "listItem":
            return listItemToJSX(ctx, node)
        case "blockquote":
            return blockquoteToJSX(ctx, node)
        case "strong":
            return strongToJSX(ctx, node)
        case "emphasis":
            return emphasisToJSX(ctx, node)
        case "delete":
            return deleteToJSX(ctx, node)
        case "inlineCode":
            return inlineCodeToJSX(node)
        case "link":
            return linkToJSX(ctx, node)
        case "autoTagLink":
            return autoTagLinkToJSX(ctx, node)
        case "image":
            return imageToJSX(ctx, node)
        case "code":
            return codeToJSX(node)
        case "table":
            return tableToJSX(ctx, node)
        case "footnoteReference":
            return footnoteReferenceToJSX(ctx, node)
        case "footnoteDefinition":
            return footnoteDefinitionToJSX(ctx, node)
        case "containerDirective":
            return directiveToJSX(ctx, node)
        case "leafDirective":
            return directiveToJSX(ctx, node)
        case "textDirective":
            return directiveToJSX(ctx, node)
        case "break":
            return <br key={nodeKey(node)} />
        case "thematicBreak":
            return <hr key={nodeKey(node)} />
        case "html":
            return (
                <Alert variant="danger" key={nodeKey(node)}>
                    HTML ist not supported
                </Alert>
            )
    }

    throw new Error(`unknown node type ${node.type}`)
}

function headingToJSX(ctx: Context, node: Heading): ReactNode {
    let children = node.children.map((c) => astNodeToJSX(ctx, c))
    let key = nodeKey(node)
    let id = `${ctx.id}-${idFromText(...extractText(node.children))}`
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

function paragraphtoJSX(ctx: Context, node: Paragraph): ReactNode {
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
            paragraphs.push(astNodeToJSX(ctx, c))
        } else {
            currentParagraphChildren.push(astNodeToJSX(ctx, c))
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

function listToJSX(ctx: Context, node: List): ReactNode {
    let children = node.children.map((c) => astNodeToJSX(ctx, c))
    let key = nodeKey(node)
    if (node.ordered) {
        return <ol key={key}>{children}</ol>
    }

    return <ul key={key}>{children}</ul>
}

function listItemToJSX(ctx: Context, node: ListItem): ReactNode {
    return (
        <li key={nodeKey(node)}>
            {stripParagraph(node).map((c) => astNodeToJSX(ctx, c))}
        </li>
    )
}

function blockquoteToJSX(ctx: Context, node: Blockquote): ReactNode {
    return (
        <blockquote key={nodeKey(node)}>
            {stripParagraph(node).map((c) => astNodeToJSX(ctx, c))}
        </blockquote>
    )
}

function emphasisToJSX(ctx: Context, node: Emphasis): ReactNode {
    return (
        <em key={nodeKey(node)}>
            {node.children.map((c) => astNodeToJSX(ctx, c))}
        </em>
    )
}

function deleteToJSX(ctx: Context, node: Delete): ReactNode {
    return (
        <del key={nodeKey(node)}>
            {node.children.map((c) => astNodeToJSX(ctx, c))}
        </del>
    )
}

function strongToJSX(ctx: Context, node: Strong): ReactNode {
    return (
        <strong key={nodeKey(node)}>
            {node.children.map((c) => astNodeToJSX(ctx, c))}
        </strong>
    )
}

function inlineCodeToJSX(node: InlineCode): ReactNode {
    return <code key={nodeKey(node)}>{node.value}</code>
}

function linkToJSX(ctx: Context, node: LinkNode): ReactNode {
    let url = node.url
    if (url.startsWith("#")) {
        url = `#${ctx.id}-${url.replace("#", "")}`
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
            {node.children.map((c) => astNodeToJSX(ctx, c))}
        </a>
    )
}

function autoTagLinkToJSX(ctx: Context, node: AutoTagLink): ReactNode {
    return (
        <Link
            href={`/memos?filter[tag]=${node.tag}`}
            key={nodeKey(node)}
            rel="tag"
        >
            {node.children.map((c) => astNodeToJSX(ctx, c))}
        </Link>
    )
}

function imageToJSX(ctx: Context, node: Image): ReactNode {
    let id = `${ctx.id}-${idFromText(node.title || node.alt || node.url)}`

    return (
        <ImageComp
            key={nodeKey(node)}
            id={id}
            src={node.url}
            alt={node.alt ?? node.url}
            caption={node.title ?? undefined}
        />
    )
}

function codeToJSX(node: CodeBlock): ReactNode {
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

function tableToJSX(ctx: Context, node: Table): ReactNode {
    if (node.children.length === 0) {
        return <table key={nodeKey(node)} />
    }

    let [header, ...rows] = node.children

    let alignments: AlignType[] = node.align || []

    return (
        <div key={nodeKey(node)} className="table-wrapper">
            <table>
                <thead>{tableRowToJSX(ctx, header, alignments)}</thead>
                <tbody>
                    {rows.map((row) => tableRowToJSX(ctx, row, alignments))}
                </tbody>
            </table>
        </div>
    )
}

function tableRowToJSX(
    ctx: Context,
    node: TableRow,
    alignments: AlignType[],
): ReactNode {
    return (
        <tr key={nodeKey(node)}>
            {node.children.map((c, i) => tableCellToJSX(ctx, c, alignments[i]))}
        </tr>
    )
}

function tableCellToJSX(
    ctx: Context,
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
            {node.children.map((c) => astNodeToJSX(ctx, c))}
        </td>
    )
}

function footnoteDefinitionToJSX(
    ctx: Context,
    node: FootnoteDefinition,
): ReactNode {
    ctx.footnotes.push(
        <li id={`fn:${ctx.id}-${node.identifier}`} key={nodeKey(node)}>
            {stripParagraph(node).map((c) => astNodeToJSX(ctx, c))}

            {/* biome-ignore lint/a11y/useValidAriaRole: false positive */}
            {/* biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: false positive */}
            <a
                href={`#fnref:${ctx.id}-${node.identifier}`}
                role="doc-backlink"
                className="ml-1 p-1 relative top-0.5 inline-flex hover:text-primary-contrast hover:bg-primary rounded"
            >
                <ArrowUDownLeft />
            </a>
        </li>,
    )
    return null
}

function footnoteReferenceToJSX(
    ctx: Context,
    node: FootnoteReference,
): ReactNode {
    return (
        <sup id={`fnref:${ctx.id}-${node.identifier}`} key={nodeKey(node)}>
            {/* biome-ignore lint/a11y/useValidAriaRole: false positive */}
            {/* biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: false positive */}
            <a href={`#fn:${ctx.id}-${node.identifier}`} role="doc-noteref">
                {node.label}
            </a>
        </sup>
    )
}

function directiveToJSX(
    ctx: Context,
    node: ContainerDirective | LeafDirective | TextDirective,
): ReactNode {
    let Directive = directives[node.name as keyof typeof directives]
    if (!Directive) {
        return (
            <Alert
                variant="danger"
                key={nodeKey(node)}
            >{`Unknown directive "${node.name}"`}</Alert>
        )
    }

    let children = node.children.map((c) => astNodeToJSX(ctx, c))
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
