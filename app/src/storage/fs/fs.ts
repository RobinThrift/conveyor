import type { Context } from "@/lib/context"
import { calcSha256Hash } from "@/lib/crypto"
import type { FS } from "@/lib/fs"
import { type AsyncResult, Ok } from "@/lib/result"

export async function readAttachment(
    ctx: Context,
    fs: FS,
    filepath: string,
): AsyncResult<ArrayBufferLike> {
    return fs.read(ctx, filepath)
}

export async function removeAttachment(
    ctx: Context,
    fs: FS,
    filepath: string,
): AsyncResult<void> {
    return fs.remove(ctx, filepath)
}

export async function writeAttachment(
    ctx: Context,
    fs: FS,
    content: ArrayBufferLike,
): AsyncResult<{
    sizeBytes: number
    sha256: Uint8Array<ArrayBufferLike>
    filepath: string
}> {
    let ab = new ArrayBuffer(content.byteLength)
    new Uint8Array(ab).set(new Uint8Array(content), 0)

    let digest = await calcSha256Hash(ab)
    if (!digest.ok) {
        return digest
    }

    let sha256 = new Uint8Array(digest.value)

    let filepath = ""
    for (let b of sha256) {
        let h = b.toString(16)
        if (h.length < 2) {
            h = `0${h}`
        }
        filepath += `/${h}`
    }

    let mkdirpResult = await fs.mkdirp(ctx, dirname(filepath))
    if (!mkdirpResult.ok) {
        return mkdirpResult
    }

    let writeResult = await fs.write(ctx, filepath, content)
    if (!writeResult.ok) {
        return writeResult
    }

    return Ok({
        sha256,
        sizeBytes: content.byteLength,
        filepath,
    })
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
