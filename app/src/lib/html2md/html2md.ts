export function html2md(html: string): string {
    let parser = new DOMParser()
    let doc = parser.parseFromString(html, "text/html")
    return Array.from(doc.body.childNodes)
        .map((el) => node2md(el))
        .join("")
        .trim()
}

function node2md(node: Node): string {
    switch (node.nodeType) {
        case Node.ELEMENT_NODE:
            return el2md(node as Element)
        case Node.TEXT_NODE:
            return node.textContent || ""
    }

    return ""
}

function el2md(el: Element): string {
    switch (el.tagName) {
        case "PRE": {
            let codeEl = el.querySelector("code")
            if (codeEl) {
                return codeSnippet2md(codeEl as HTMLElement)
            }
            break
        }
        case "DIV":
        case "P":
            return paragraph2md(el as HTMLParagraphElement)
        case "STRONG":
        case "EM":
            return em2md(el as HTMLElement)
        case "CODE":
            return code2md(el as HTMLElement)
        case "DEL":
            return del2md(el as HTMLElement)
        case "A":
            return a2md(el as HTMLElement)
        case "BLOCKQUOTE":
            return blockquote2md(el as HTMLElement)
        case "H1":
            return heading2md(1, el as HTMLElement)
        case "H2":
            return heading2md(2, el as HTMLElement)
        case "H3":
            return heading2md(3, el as HTMLElement)
        case "H4":
            return heading2md(4, el as HTMLElement)
        case "H5":
            return heading2md(5, el as HTMLElement)
        case "H6":
            return heading2md(6, el as HTMLElement)
    }

    return el.textContent || ""
}

function paragraph2md(el: HTMLParagraphElement): string {
    return `\n${Array.from(el.childNodes)
        .map((el) => node2md(el).trim())
        .filter((c) => c.length)
        .join(" ")}\n`
}

function blockquote2md(el: HTMLElement): string {
    return `\n> ${Array.from(el.childNodes)
        .map((el) => node2md(el).trim())
        .filter((c) => c.length)
        .join("\n> ")}\n`
}

function em2md(el: HTMLElement): string {
    return `*${el.textContent || ""}*`
}

function code2md(el: HTMLElement): string {
    return `\`${el.textContent || ""}\``
}

function del2md(el: HTMLElement): string {
    return `~~${el.textContent || ""}~~`
}

function a2md(el: HTMLElement): string {
    return `[${Array.from(el.childNodes)
        .map((el) => node2md(el).trim())
        .filter((c) => c.length)
        .join(" ")}](${el.getAttribute("href")})`
}

function heading2md(level: number, el: HTMLElement): string {
    return `\n\n${"#".repeat(level)} ${el.textContent || ""}\n`
}

function codeSnippet2md(el: HTMLElement): string {
    Array.from(el.children).forEach((c) => removeNumberOnlyElements(c))

    let lang = ""
    let code = Array.from(el.children)
        .map((c) => c.textContent?.trimEnd() ?? "")
        .join("\n")

    if (!lang) {
        let langClass = Array.from(el.classList).find((l) => l.startsWith("language-"))
        if (langClass) {
            lang = langClass.substring(9)
        }
    }

    return `\`\`\`${lang}\n${code.trim()}\n\`\`\`\n`
}

const isDigitPattern = /^\d+$/gm

function removeNumberOnlyElements(el: Element) {
    let text = el.textContent
    if (!text) {
        return
    }

    if (isDigitPattern.test(text.trim())) {
        el.remove()
        return
    }

    Array.from(el.children).forEach((c) => removeNumberOnlyElements(c))
}
