export * from "micromark-util-types"

declare module "micromark-util-types" {
    interface Token {
        _tag?: string
    }

    /**
     * Token types.
     */
    interface TokenTypeMap {
        autoTagLink: "autoTagLink"
    }
}
