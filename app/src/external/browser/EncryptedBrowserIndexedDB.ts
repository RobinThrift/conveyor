import type { Context } from "@/lib/context"
import type { Crypto } from "@/lib/crypto"
import { parseJSON } from "@/lib/json"
import { type AsyncResult, Ok, type Result } from "@/lib/result"
import { encodeText } from "@/lib/textencoding"
import { BrowserIndexedDB } from "./BrowserIndexedDB"

interface EncryptedItem {
    key: IDBValidKey
    data: ArrayBufferLike
}

export class EncryptedBrowserIndexedDB<D> {
    private _name: string
    private _crypto: Crypto
    private _db = new BrowserIndexedDB<{ items: EncryptedItem }>()
    private _keyFrom: (d: D) => IDBValidKey
    private _stringify: (d: D) => Uint8Array<ArrayBufferLike>
    private _parse: (raw: Uint8Array<ArrayBufferLike>) => Result<D>

    constructor({
        name,
        crypto,
        keyFrom,
        parse = parseJSON,
        stringify,
    }: {
        name: string
        crypto: Crypto
        keyFrom: (d: D) => IDBValidKey
        stringify?: (d: D) => Uint8Array<ArrayBufferLike>
        parse?: (raw: Uint8Array<ArrayBufferLike>) => Result<D>
    }) {
        this._name = name
        this._crypto = crypto
        this._keyFrom = keyFrom
        this._stringify = stringify ?? ((d: D) => encodeText(JSON.stringify(d)))
        this._parse = parse
    }

    async open(ctx: Context): AsyncResult<void> {
        return this._db.open(ctx, this._name, [
            async (db) => {
                db.createObjectStore("items", {
                    keyPath: "key",
                })
                return Ok(undefined)
            },
        ])
    }

    close() {
        return this._db.close()
    }

    public async insertOrUpdate(ctx: Context, data: D[]): AsyncResult<void> {
        let items: EncryptedItem[] = []
        for (let d of data) {
            let encrypted = await this._crypto.encryptData(this._stringify(d))
            if (!encrypted.ok) {
                return encrypted
            }
            items.push({
                key: this._keyFrom(d),
                data: encrypted.value,
            })
        }

        return this._db.insertOrUpdate(ctx, "items", items)
    }

    public async get(
        ctx: Context,
        key: IDBValidKey,
    ): AsyncResult<D | undefined> {
        let item = await this._db.get(ctx, "items", key)
        if (!item.ok) {
            return item
        }
        if (!item.value) {
            return Ok(undefined)
        }

        let decrypted = await this._crypto.decryptData(
            new Uint8Array(item.value.data),
        )
        if (!decrypted.ok) {
            return decrypted
        }

        return this._parse(new Uint8Array(decrypted.value))
    }

    public async listKeys(ctx: Context): AsyncResult<IDBValidKey[]> {
        return this._db.listKeys(ctx, "items")
    }

    public async delete(ctx: Context, key: IDBValidKey): AsyncResult<void> {
        return this._db.delete(ctx, "items", key)
    }
}
