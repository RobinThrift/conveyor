import type { SenstiveValue } from "@/lib/sensitive"

export type PlaintextAuthTokenValue = SenstiveValue

export interface AuthToken {
    origin: string
    accessToken: PlaintextAuthTokenValue
    expiresAt: Date
    refreshToken: PlaintextAuthTokenValue
    refreshExpiresAt: Date
}

export class AuthTokenNotFoundError extends Error {
    constructor(suffix: string) {
        super(`Auth token not found: ${suffix}`)
    }
}
