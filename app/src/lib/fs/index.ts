import type { Context } from "@/lib/context"
import { CustomErrCode, type ErrorCode } from "@/lib/errors"
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
    public static [CustomErrCode] = "FS_NOT_FOUND_ERROR" as ErrorCode

    constructor(filepath: string, options?: ErrorOptions) {
        super(
            `[${FSNotFoundError[CustomErrCode]}] file not found: ${filepath}`,
            options,
        )
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
        if (!s) {
            continue
        }

        if (s[0] === "/" || final.at(-1) === "/") {
            final += s
        } else {
            final += `/${s}`
        }
    }
    return final
}
