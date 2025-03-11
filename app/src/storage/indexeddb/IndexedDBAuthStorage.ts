import { type AuthToken, AuthTokenNotFoundError } from "@/auth"
import { EncryptedBrowserIndexedDB } from "@/external/browser/EncryptedBrowserIndexedDB"
import type { Context } from "@/lib/context"
import type { Crypto } from "@/lib/crypto"
import { parseJSON, parseJSONDate } from "@/lib/json"
import { type AsyncResult, Err, Ok } from "@/lib/result"

export class IndexedDBAuthStorage {
    private _db: EncryptedBrowserIndexedDB<AuthToken>

    constructor(crypto: Crypto) {
        this._db = new EncryptedBrowserIndexedDB<AuthToken>({
            name: "AuthStorage",
            crypto,
            keyFrom: (a) => a.origin,
            parse: (raw) =>
                parseJSON<AuthToken, Record<string, any>>(raw, (obj) => {
                    let expiresAt = parseJSONDate(obj.value.expiresAt)
                    if (!expiresAt.ok) {
                        return expiresAt
                    }
                    let refreshExpiresAt = parseJSONDate(
                        obj.value.refreshExpiresAt,
                    )
                    if (!refreshExpiresAt.ok) {
                        return refreshExpiresAt
                    }

                    return Ok({
                        origin: obj.origin,
                        accessToken: obj.accessToken,
                        expiresAt: expiresAt.value,
                        refreshToken: obj.refreshValue,
                        refreshExpiresAt: refreshExpiresAt.value,
                    })
                }),
        })
    }

    open(ctx: Context): AsyncResult<void> {
        return this._db.open(ctx)
    }

    close() {
        return this._db.close()
    }

    public async getAuthToken(
        ctx: Context,
        origin: string,
    ): AsyncResult<AuthToken> {
        let token = await this._db.get(ctx, origin)
        if (!token.ok) {
            return token
        }
        if (!token.value) {
            return Err(new AuthTokenNotFoundError(origin))
        }

        return Ok(token.value)
    }

    public async saveAuthToken(
        ctx: Context,
        authToken: AuthToken,
    ): AsyncResult<void> {
        return this._db.insertOrUpdate(ctx, [authToken])
    }
}
