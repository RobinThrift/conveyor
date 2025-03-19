import type { Context } from "@/lib/context"
import type { ErrorCode, JSONErrObj } from "@/lib/errors"
import type { AsyncResult } from "@/lib/result"

export interface FS {
    read(ctx: Context, filepath: string): AsyncResult<ArrayBufferLike>

    write(
        ctx: Context,
        filepath: string,
        content: ArrayBufferLike,
    ): AsyncResult<number>

    remove(ctx: Context, filepath: string): AsyncResult<void>

    mkdirp(ctx: Context, dirpath: string): AsyncResult<void>
}

export class FSNotFoundError extends Error {
    static ERR_CODE = "FS_NOT_FOUND_ERROR" as ErrorCode

    constructor(filepath: string, options?: ErrorOptions) {
        super(
            `[${FSNotFoundError.ERR_CODE}] file not found: ${filepath}`,
            options,
        )
    }

    static is(value: any): boolean {
        if (value instanceof FSNotFoundError) {
            return true
        }

        if (typeof value === "object" && "message" in value) {
            return value.message.includes(`[${FSNotFoundError.ERR_CODE}]`)
        }

        return false
    }

    static fromJSONErrObj(obj: JSONErrObj): FSNotFoundError {
        let err = new FSNotFoundError("")
        err.message = obj.message
        err.stack = obj.stack ?? err.stack
        return err
    }
}

export function dirname(filepath: string): string {
    let lastSlashIndex = filepath.lastIndexOf("/")
    if (lastSlashIndex === -1) {
        return "."
    }

    let dir = filepath.substring(0, lastSlashIndex)
    if (dir === "") {
        return "."
    }

    return dir
}

export function join(...segments: string[]): string {
    let final = ""
    for (let s of segments) {
        if (s[0] === "/") {
            final += s
        } else {
            final += `/${s}`
        }
    }
    return final
}
