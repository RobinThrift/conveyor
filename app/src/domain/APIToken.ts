import type { Temporal } from "temporal-polyfill"

export interface APIToken {
    name: string
    createdAt: Temporal.ZonedDateTime
    expiresAt: Temporal.ZonedDateTime
}

export interface APITokenList {
    items: APIToken[]
    next?: string
}
