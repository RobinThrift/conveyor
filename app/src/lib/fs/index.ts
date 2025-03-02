import type { Context } from "@/lib/context"
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
