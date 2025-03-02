export * from "mdast"

declare module "mdast" {
    interface AutoTagLink extends Parent {
        type: "autoTagLink"
        tag: string
    }

    interface ConstructNameMap {
        autoTagLink: "autoTagLink"
    }

    interface RootContentMap {
        autoTagLink: AutoTagLink
    }
}
