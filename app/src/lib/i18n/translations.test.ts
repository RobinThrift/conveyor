import { assert, suite, test } from "vitest"

import { loadTranslation, resolveTranslation } from "./translations"

suite("lib/i18n/translations", () => {
    test("loadTranslation", async () => {
        let t = await loadTranslation("de")
        assert.isDefined(t)
    })

    test("resolveTranslation", async () => {
        let de = await loadTranslation("de")
        if (!de) {
            assert.fail()
        }
        let t = resolveTranslation("en-gb", de)
        assert.isDefined(t)
    })
})
