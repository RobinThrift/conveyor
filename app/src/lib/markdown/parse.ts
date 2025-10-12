import type { Tree } from "@lezer/common"
import {
    Autolink,
    parser as baseParser,
    Strikethrough,
    Subscript,
    Superscript,
    Table,
    TaskList,
} from "@lezer/markdown"

import { fromThrowing, type Result } from "@/lib/result"

import { customBlocks } from "./extensions/blocks"
import { footnotes } from "./extensions/footnotes"
import { tagLinks } from "./extensions/tags"

const extended = baseParser.configure([
    TaskList,
    Strikethrough,
    Subscript,
    Superscript,
    Autolink,
    Table,
    footnotes,
    tagLinks,
    customBlocks,
])

export function parse(markdown: string): Result<Tree> {
    return fromThrowing(() => extended.parse(markdown))
}
