import type {
    CompileContext,
    Extension as MDASTExtension,
    Token,
} from "mdast-util-from-markdown"
import { markdownLineEndingOrSpace } from "micromark-util-character"
import { codes } from "micromark-util-symbol"
import type {
    Code,
    Effects,
    Extension,
    State,
    TokenizeContext,
} from "micromark-util-types"

export function autoTagLinks(): Extension {
    return {
        text: {
            [codes.numberSign]: {
                name: "tag",
                concrete: true,
                tokenize: tokenizeTag,
                previous: prev,
            },
        },
    }
}

function prev(this: TokenizeContext, code: Code) {
    if (!code) {
        return true
    }

    if (this.currentConstruct?.name === "labelStartLink") {
        return false
    }
    return markdownLineEndingOrSpace(code)
}

function tokenizeTag(effects: Effects, ok: State, nok: State) {
    let buffer = ""

    function consumeTag(code: Code) {
        if (
            !code ||
            code === codes.space ||
            code === codes.lineFeed ||
            code === codes.eof
        ) {
            effects.exit("chunkString")
            let token = effects.exit("autoTagLink")
            token._tag = buffer
            return ok(code)
        }

        effects.consume(code)
        buffer += String.fromCodePoint(code)

        return consumeTag
    }

    return function start(code: Code) {
        if (code !== codes.numberSign) {
            return nok(code)
        }
        effects.enter("autoTagLink")
        effects.enter("chunkString", { contentType: "string" })
        effects.consume(code)

        return consumeTag
    }
}

export function mdastAutoTagLinks(): MDASTExtension {
    return {
        enter: {
            autoTagLink: enterAutoTagLink,
        },
        exit: {
            autoTagLink: exitAutoTagLink,
        },
    }
}

function enterAutoTagLink(this: CompileContext, token: Token) {
    this.enter(
        { type: "autoTagLink", tag: token._tag || "", children: [] },
        token,
    )
}

function exitAutoTagLink(this: CompileContext, token: Token) {
    this.exit(token)
}
