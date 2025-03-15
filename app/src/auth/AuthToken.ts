export type PlaintextAuthTokenValue = string & { readonly "": unique symbol }

export interface AuthToken {
    origin: string
    accessToken: PlaintextAuthTokenValue
    expiresAt: Date
    refreshToken: PlaintextAuthTokenValue
    refreshExpiresAt: Date
}

export class AuthTokenNotFoundError extends Error {
    constructor(suffix: string, options?: ErrorOptions) {
        super(`Auth token not found: ${suffix}`, options)
    }
}

export class PasswordChangeRequiredError extends Error {
    constructor(options?: ErrorOptions) {
        super("password change required", options)
    }
}
