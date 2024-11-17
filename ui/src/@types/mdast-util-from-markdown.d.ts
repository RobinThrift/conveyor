export * from "mdast-util-from-markdown"
import type { Parent, Resource } from "mdast-util-from-markdown"

declare module "mdast-util-to-markdown" {
    interface AutoTagLink extends Parent {
        type: "autoTagLink"
        url: string
    }

    interface ConstructNameMap {
        autoTagLink: "autoTagLink"
    }

    interface RootContentMap {
        autoTagLink: AutoTagLink
    }
}
