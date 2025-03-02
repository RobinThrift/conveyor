import { assert, suite, test } from "vitest"

import { encodeText } from "@/lib/textencoding"

import { calcSha256Hash } from "./webcrypto"

suite("crypto", () => {
    test("calcSha256Hash", async () => {
        let text = "12345 abcdef"
        let buf = encodeText(text)

        let hash = await calcSha256Hash(buf)

        const hashArray = Array.from(new Uint8Array(hash))
        let hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

        assert.equal(
            hex,
            "72e062d03d61be54a1a1ba989138cae1d6b32f3eb7583af6920c207381f5174d",
        )
    })
})
