import type { Context } from "@/lib/context"
import { Err, Ok, type AsyncResult } from "@/lib/result"
import type { AuthToken } from "@/auth"

export class TestInMemAuthStorage {
    private _tokens = new Map<string, AuthToken>()

    async getAuthToken(_: Context, origin: string): AsyncResult<AuthToken> {
        let token = this._tokens.get(origin)
        if (token) {
            return Ok(token)
        }

        return Err(new Error("no valid access token or refresh token"))
    }

    async saveAuthToken(_: Context, authToken: AuthToken): AsyncResult<void> {
        this._tokens.set(authToken.origin, authToken)
        return Ok(undefined)
    }
}
