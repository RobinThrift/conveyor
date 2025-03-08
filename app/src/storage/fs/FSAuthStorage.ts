import { type AuthToken, AuthTokenNotFoundError } from "@/auth"
import type { Context } from "@/lib/context"
import type { Decrypter, Encrypter } from "@/lib/crypto"
import { type FS, FSNotFoundError, join } from "@/lib/fs"
import { type AsyncResult, Err, Ok, fmtErr } from "@/lib/result"
import { encodeText } from "@/lib/textencoding"
import { parseJSON, parseJSONDate } from "@/lib/json"

export class FSAuthStorage {
    private _cryto: Encrypter & Decrypter
    private _fs: FS
    private _dir: string

    constructor({
        fs,
        dir = "auth",
        crypto,
    }: {
        fs: FS
        dir: string
        crypto: Encrypter & Decrypter
    }) {
        this._fs = fs
        this._dir = dir
        this._cryto = crypto
    }

    public async getAuthToken(
        ctx: Context,
        origin: string,
    ): AsyncResult<AuthToken> {
        let filepath = join(this._dir, `${escapeOrigin(origin)}.enc.json`)
        let data = await this._fs.read(ctx, filepath)
        if (!data.ok) {
            if (data.err instanceof FSNotFoundError) {
                return Err(new AuthTokenNotFoundError(origin))
            }
            return fmtErr(
                `error loading auth token from file ${filepath}: %w`,
                data,
            )
        }

        let decrypted = await this._cryto.decryptData(
            new Uint8Array(data.value),
        )
        if (!decrypted.ok) {
            return decrypted
        }

        return parseJSON<AuthToken, Record<string, any>>(
            decrypted.value,
            (obj) => {
                let expiresAt = parseJSONDate(obj.value.expiresAt)
                if (!expiresAt.ok) {
                    return expiresAt
                }
                let refreshExpiresAt = parseJSONDate(obj.value.refreshExpiresAt)
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
            },
        )
    }

    public async saveAuthToken(
        ctx: Context,
        authToken: AuthToken,
    ): AsyncResult<void> {
        let encrypted = await this._cryto.encryptData(
            encodeText(JSON.stringify(authToken)),
        )
        if (!encrypted.ok) {
            return encrypted
        }

        let filepath = join(this._dir, `${escapeOrigin(origin)}.enc.json`)
        let written = await this._fs.write(ctx, filepath, encrypted.value)
        if (!written.ok) {
            return fmtErr(
                `error saving auth token to file ${filepath}: %w`,
                written,
            )
        }

        return Ok(undefined)
    }
}

function escapeOrigin(origin: string): string {
    return origin
        .replace(/https?:\/\//g, "")
        .replaceAll(/[/]/g, "__")
        .replaceAll(":", "")
}
