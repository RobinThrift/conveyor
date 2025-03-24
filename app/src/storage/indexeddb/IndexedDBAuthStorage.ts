import { type AuthToken, AuthTokenNotFoundError } from "@/auth"
import { EncryptedBrowserIndexedDB } from "@/external/browser/EncryptedBrowserIndexedDB"
import type { Context } from "@/lib/context"
import type { Decrypter, Encrypter } from "@/lib/crypto"
import { parseJSON, parseJSONDate } from "@/lib/json"
import { type AsyncResult, Err, Ok } from "@/lib/result"

export class IndexedDBAuthStorage {
    private _db: EncryptedBrowserIndexedDB<AuthToken>

    constructor(crypto: Encrypter & Decrypter) {
        this._db = new EncryptedBrowserIndexedDB<AuthToken>({
            name: "AuthStorage",
            crypto,
            keyFrom: (a) => a.origin,
            parse: (raw) =>
                parseJSON<AuthToken, Record<string, any>>(raw, (obj) => {
                    let expiresAt = parseJSONDate(obj.expiresAt)
                    if (!expiresAt.ok) {
                        return expiresAt
                    }
                    let refreshExpiresAt = parseJSONDate(obj.refreshExpiresAt)
                    if (!refreshExpiresAt.ok) {
                        return refreshExpiresAt
                    }

                    return Ok({
                        origin: obj.origin,
                        accessToken: obj.accessToken,
                        expiresAt: expiresAt.value,
                        refreshToken: obj.refreshToken,
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

    async removeAllAuthTokens(ctx: Context): AsyncResult<void> {
        let origins = await this._db.listKeys(ctx)
        if (!origins.ok) {
            return origins
        }

        for (let origin of origins.value) {
            let deleted = await this._db.delete(ctx, origin)
            if (!deleted.ok) {
                return deleted
            }
        }

        return Ok(undefined)
    }
}
