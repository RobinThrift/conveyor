import type { Context } from "@/lib/context"
import type { FS } from "@/lib/fs"
import { type AsyncResult, Err, Ok } from "@/lib/result"
import { FSErrNotFound } from "@/storage/fs/errors"

export class MockFS implements FS {
    private _files = new Map<string, ArrayBufferLike>()

    public async read(
        _: Context,
        filepath: string,
    ): AsyncResult<ArrayBufferLike> {
        let contents = this._files.get(filepath)
        if (!contents) {
            return Err(new FSErrNotFound(filepath))
        }

        return Ok(contents)
    }

    public async write(
        _: Context,
        filepath: string,
        content: ArrayBufferLike,
    ): AsyncResult<number> {
        this._files.set(filepath, content)
        return Ok(content.byteLength)
    }

    public async remove(_: Context, filepath: string): AsyncResult<void> {
        this._files.delete(filepath)
        return Ok(undefined)
    }

    public async mkdirp(_: Context): AsyncResult<void> {
        return Ok(undefined)
    }

    public removeAllFiles() {
        this._files = new Map<string, ArrayBufferLike>()
    }
}
