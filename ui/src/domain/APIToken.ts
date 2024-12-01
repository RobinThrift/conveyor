export interface APIToken {
    name: string
    createdAt: Date
    expiresAt: Date
}

export interface APITokenList {
    items: APIToken[]
    next?: string
}
