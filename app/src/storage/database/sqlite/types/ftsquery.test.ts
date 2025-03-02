import { assert, suite, test } from "vitest"

import { prepareFTSQueryString } from "./ftsquery"

suite("SQLite/Types/FTSQuery", () => {
    test.each([
        ["Empty String", { input: "", expected: "" }],
        [
            "Wrap all bare in quotes",
            { input: "One Two Three", expected: `"One Two Three"` },
        ],
        [
            "Ignore quoted strings",
            {
                input: `One "Two Three" Four`,
                expected: `"One" "Two Three" "Four"`,
            },
        ],
        [
            "Ignore AND",
            { input: "One AND Three", expected: `"One" and "Three"` },
        ],
        ["Ignore OR", { input: "One OR Three", expected: `"One" or "Three"` }],
        ["Ignore NOT", { input: "One NOT Two", expected: `"One" not "Two"` }],
        ["Ignore +", { input: "One + Three", expected: `"One" + "Three"` }],
        ["Ignore *", { input: "One Two*", expected: `"One Two"*` }],
        [
            "Special Chars With Prefix",
            { input: "# Test Memo 1*", expected: `"# Test Memo 1"*` },
        ],
        [
            "Non ASCII",
            {
                input: "# Übersicht der Änderungen",
                expected: `"# Übersicht der Änderungen"`,
            },
        ],
        ["Start with star", { input: "*github", expected: `*"github"` }],
        ["End with star", { input: "github*", expected: `"github"*` }],
    ])("%s", (_, { input, expected }) => {
        let actual = prepareFTSQueryString(input)
        assert.equal(actual, expected, input)
    })
})
