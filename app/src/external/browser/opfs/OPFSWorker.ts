import { Lock } from "@/lib/Lock"
import type { Context } from "@/lib/context"
import { createErrType } from "@/lib/errors"
import { FSNotFoundError } from "@/lib/fs"
import { type AsyncResult, Ok, fromPromise, wrapErr } from "@/lib/result"
import { createWorker, isWorkerContext } from "@/lib/worker"

const _rootDir = (async () => {
    if (isWorkerContext()) {
        return navigator.storage.getDirectory()
    }

    return undefined as any
})()

const ErrReadFile = createErrType("OPFSWorker", "error reading file")
const ErrWriteFile = createErrType("OPFSWorker", "error writing file")
const ErrRemoveFile = createErrType("OPFSWorker", "error removing file")
const ErrMkdir = createErrType("OPFSWorker", "error making directory")

export const OPFSWorker = createWorker({
    read: async (
        ctx: Context,
        { filepath }: { filepath: string },
    ): AsyncResult<ArrayBufferLike> => {
        let [file, err] = await fromPromise(openFile(await _rootDir, filepath))
        if (err) {
            if (err instanceof DOMException && err.name === "NotFoundError") {
                return wrapErr`${new ErrReadFile()}: ${new FSNotFoundError(filepath, { cause: err })}`
            }

            return wrapErr`${new ErrReadFile()}: ${err}`
        }

        let lock = new Lock(`opfs:${filepath}`)

        return lock.run(ctx, async () => {
            let [fh, err] = await fromPromise(file.createSyncAccessHandle())
            if (err) {
                return wrapErr`${new ErrReadFile()}: error creating sync access handle: ${err}`
            }

            let data = new Uint8Array(fh.getSize())
            fh.read(data)
            fh.close()

            return Ok(data.buffer)
        })
    },

    write: async (
        ctx: Context,
        { filepath, content }: { filepath: string; content: ArrayBufferLike },
    ): AsyncResult<number> => {
        let file = await openFile(await _rootDir, filepath, true)

        let lock = new Lock(`opfs:${filepath}`)

        return lock.run(ctx, async () => {
            let [fh, err] = await fromPromise(file.createSyncAccessHandle())
            if (err) {
                return wrapErr`${new ErrWriteFile()}: error creating sync access handle: ${err}`
            }

            let written = fh.write(new Uint8Array(content))
            fh.close()

            if (written !== content.byteLength) {
                return wrapErr`${new ErrWriteFile()}: number of bytes written is not the same as the data: written ${written} bytes, buffer size ${content.byteLength} bytes: ${filepath}`
            }

            return Ok(written)
        })
    },

    remove: async (
        ctx: Context,
        { filepath }: { filepath: string },
    ): AsyncResult<void> => {
        let { dir: dirname, filename } = splitFilepath(filepath)
        let [dir, err] = await fromPromise(
            getDirHandle(await _rootDir, dirname),
        )
        if (err) {
            return wrapErr`${new ErrRemoveFile()}: ${filepath}: error getting dir handle: ${err}`
        }

        let lock = new Lock(`opfs:${filepath}`)

        return lock.run(ctx, async () => {
            let [_, err] = await fromPromise(dir.removeEntry(filename))
            if (err) {
                if (
                    err instanceof DOMException &&
                    err.name === "NotFoundError"
                ) {
                    return wrapErr`${new ErrRemoveFile()}: ${new FSNotFoundError(filepath, { cause: err })}`
                }

                return wrapErr`${new ErrRemoveFile()}: ${filepath}: ${err}`
            }

            return Ok()
        })
    },

    mkdirp: async (
        _: Context,
        { dirpath }: { dirpath: string },
    ): AsyncResult<void> => {
        let curr = await _rootDir
        if (dirpath === ".") {
            return Ok(undefined)
        }

        let dirs = dirpath.split("/")

        for (let dir of dirs) {
            if (dir === "") {
                continue
            }

            let [result, err] = await fromPromise(
                curr.getDirectoryHandle(dir, { create: true }),
            )
            if (err) {
                return wrapErr`${new ErrMkdir()}: error getting directory handle: ${dir}: ${err}`
            }

            curr = result
        }

        return Ok()
    },
})

async function getDirHandle(
    rootDir: FileSystemDirectoryHandle,
    dirpath: string,
) {
    let curr = rootDir
    let dirs = dirpath.split("/")

    if (dirpath === ".") {
        return rootDir
    }

    for (let dir of dirs) {
        if (dir === "") {
            continue
        }

        curr = await curr.getDirectoryHandle(dir)
    }

    return curr
}

async function openFile(
    rootDir: FileSystemDirectoryHandle,
    filepath: string,
    create?: boolean,
) {
    let { dir: dirname, filename } = splitFilepath(filepath)
    let dir = await getDirHandle(rootDir, dirname)

    return dir.getFileHandle(filename, { create })
}

function splitFilepath(filepath: string): {
    dir: string
    filename: string
} {
    let lastSlashIndex = filepath.lastIndexOf("/")
    if (lastSlashIndex === -1) {
        return { dir: ".", filename: filepath }
    }

    let dir = filepath.substring(0, lastSlashIndex)
    if (dir === "") {
        return { dir: ".", filename: filepath.replace(/^\//, "") }
    }

    let filename = filepath.substring(lastSlashIndex + 1)

    return { dir: dir, filename }
}
