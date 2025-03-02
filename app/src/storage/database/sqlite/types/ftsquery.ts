export function prepareFTSQueryString(str: string): string {
    if (str === "") {
        return str
    }

    let q = new FTSQuery(str)

    q.consume()

    return q.out
}

const doubleQuoteRune = `"`.codePointAt(0)
const asteriksRune = "*".charCodeAt(0)
const plusRune = "+".charCodeAt(0)
const spaceRune = " ".charCodeAt(0)
const lowerCaseNRune = "n".charCodeAt(0)
const upperCaseNRune = "N".charCodeAt(0)
const lowerCaseARune = "a".charCodeAt(0)
const upperCaseARune = "A".charCodeAt(0)
const lowerCaseORune = "o".charCodeAt(0)
const upperCaseORune = "O".charCodeAt(0)

class FTSQuery {
    private str: string
    private l: number
    private pos = 0
    private cur = 0
    private end = false
    public out = ""

    constructor(str: string) {
        this.str = str
        this.l = str.length
    }

    private next() {
        if (this.pos + 1 >= this.l) {
            this.end = true
            return
        }

        if (this.pos === 0 && this.cur === 0) {
            this.cur = this.str.charCodeAt(this.pos)
            return
        }

        this.pos++
        this.cur = this.str.charCodeAt(this.pos)
    }

    private outputCur() {
        let runeLen = runeLength(this.cur)
        this.out += this.str.substring(this.pos, this.pos + runeLen)
        this.pos += runeLen - 1
    }

    public consume() {
        this.next()
        if (this.end) {
            return
        }

        if (this.cur === doubleQuoteRune) {
            this.consumeQuoted()
        } else if (this.cur === asteriksRune) {
            this.out += "*"
            this.consume()
        } else if (this.cur === spaceRune) {
            this.outputCur()
            this.consume()
        } else if (
            (this.cur === lowerCaseNRune || this.cur === upperCaseNRune) &&
            this.peekN(3) === "ot "
        ) {
            this.consumeNot()
        } else if (
            (this.cur === lowerCaseARune || this.cur === upperCaseARune) &&
            this.peekN(3) === "nd "
        ) {
            this.consumeAnd()
        } else if (
            (this.cur === lowerCaseORune || this.cur === upperCaseORune) &&
            this.peekN(2) === "r "
        ) {
            this.consumeOr()
        } else if (this.cur === plusRune && this.peekN(1) === " ") {
            this.consumePlus()
        } else {
            this.consumeBare()
        }
    }

    private consumeQuoted() {
        while (!this.end) {
            this.outputCur()
            this.next()
            if (this.cur === doubleQuoteRune) {
                this.outputCur()
                break
            }
        }

        this.consume()
    }

    private consumeNot() {
        this.next()
        this.next()
        this.next()
        this.out += "not "
        this.consume()
    }

    private consumeAnd() {
        this.next()
        this.next()
        this.next()
        this.out += "and "
        this.consume()
    }

    private consumeOr() {
        this.next()
        this.next()
        this.out += "or "
        this.consume()
    }

    private consumePlus() {
        this.next()
        this.out += "+ "
        this.consume()
    }

    private consumeBare() {
        this.out += `"`

        while (!this.end) {
            if (this.cur === spaceRune && this.peekN(4) === "and ") {
                this.out += `"`
                this.outputCur()
                break
            }

            if (this.cur === spaceRune && this.peekN(4) === "not ") {
                this.out += `"`
                this.outputCur()
                break
            }

            if (this.cur === spaceRune && this.peekN(3) === "or ") {
                this.out += `"`
                this.outputCur()
                break
            }

            if (this.cur === spaceRune && this.peekN(2) === "+ ") {
                this.out += `"`
                this.outputCur()
                break
            }

            if (this.cur === spaceRune && this.peek(1) === doubleQuoteRune) {
                this.out += `"`
                this.outputCur()
                break
            }

            if (this.cur === asteriksRune) {
                this.out += `"`
                this.outputCur()
                return
            }

            this.outputCur()

            this.next()
        }

        if (this.cur !== spaceRune) {
            this.out += '"'
        }

        this.consume()
    }

    private peek(n: number): number {
        if (this.pos + n + 1 >= this.l) {
            return 0
        }
        return this.str.charCodeAt(this.pos + n)
    }

    private peekN(n: number): string {
        if (this.pos + n + 1 >= this.l) {
            return ""
        }
        return this.str.substring(this.pos + 1, this.pos + n + 1).toLowerCase()
    }
}

// 0xd800-0xdc00 encodes the high 10 bits of a pair.
// 0xdc00-0xe000 encodes the low 10 bits of a pair.
// the value is those 20 bits plus 0x10000.
const surr1 = 0xd800
const surr3 = 0xe000
const surrSelf = 0x10000
const maxRune = 0x10ffff // Maximum valid Unicode code point.

// Returns the number of 16-bit words in the UTF-16 encoding of the rune.
// It returns -1 if the rune is not a valid value to encode in UTF-16.
// Ported from the Go stdlib.
function runeLength(r: number): number {
    if (0 <= r && r < surr1) {
        return 1
    }

    if (surr3 <= r && r < surrSelf) {
        return 1
    }

    if (surrSelf <= r && r <= maxRune) {
        return 2
    }

    return -1
}
