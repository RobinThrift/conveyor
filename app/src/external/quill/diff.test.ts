import Delta from "quill-delta"
import { assert, suite, test } from "vitest"

import type { MemoContentChangesV1 } from "@/domain/Changelog"

import { applyChanges, changesToString } from "./diff"

suite("external/quill/diff/applyChanges", () => {
    test.each<
        [
            string,
            {
                input: string
                expected: string
                changes: MemoContentChangesV1["changes"]
            },
        ]
    >([
        ["Empty String", { input: "", expected: "", changes: [] }],
        ["Add to empty", { input: "", expected: "added", changes: [{ insert: "added" }] }],
        [
            "Insert at end",
            {
                input: "Insert text at end test",
                expected: "Insert text at end test, with more content",
                changes: [{ retain: 23 }, { insert: ", with more content" }],
            },
        ],
        [
            "Modify end",
            {
                input: "Modify text at end test,",
                expected: "Modify text at end test, with more content",
                changes: [{ retain: 23 }, { delete: 1 }, { insert: ", with more content" }],
            },
        ],
    ])("%s", (_, { input, expected, changes }) => {
        let actual = applyChanges(input, {
            version: "1",
            changes,
        })
        assert.equal(actual, expected)
    })

    test("Conflicting Change", () => {
        let input = `Line 1 to change

Line 2 will be shortened

Line 3 unchanged

Line 4 unchanged`
        let expected = `Line 1 changed

Line 2 shortened

Line 3 unchanged

Line 3.5 added

Line 4 unchanged`
        let changessets = [
            [{ retain: 25 }, { delete: 17 }, { insert: "shortened" }],
            [{ retain: 52 }, { insert: "\n\nLine 3.5 added" }],
            [{ retain: 7 }, { delete: 9 }, { insert: "changed" }],
        ]

        let diff = new Delta([{ insert: input }])
        for (let changes of changessets) {
            diff = diff.compose(new Delta(changes))
        }

        let actual = changesToString(diff.ops)

        assert.equal(actual, expected, `acutal: \n${actual}\n\nexpected: \n${expected}`)
    })
})
