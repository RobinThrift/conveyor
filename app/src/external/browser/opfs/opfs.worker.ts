import type { Context } from "@/lib/context"
import { type AsyncResult, Ok, fmtErr, fromPromise } from "@/lib/result"
import { createWorker, isWorkerContext } from "@/lib/worker"

const _rootDir = (async () => {
    if (isWorkerContext()) {
        return navigator.storage.getDirectory()
    }

    return undefined as any
})()

export const OPFSWorker = createWorker({
    read: async (
        _: Context,
        { filepath }: { filepath: string },
    ): AsyncResult<ArrayBufferLike> => {
        let file = await fromPromise(openFile(await _rootDir, filepath))
        if (!file.ok) {
            return file
        }

        let fh = await fromPromise(file.value.createSyncAccessHandle())
        if (!fh.ok) {
            return fh
        }

        let data = new Uint8Array(fh.value.getSize())
        fh.value.read(data)
        fh.value.close()

        return Ok(data.buffer)
    },

    write: async (
        _: Context,
        { filepath, content }: { filepath: string; content: ArrayBufferLike },
    ): AsyncResult<number> => {
        let file = await openFile(await _rootDir, filepath, true)

        let fh = await file.createSyncAccessHandle()

        let written = fh.write(new Uint8Array(content))

        fh.close()

        if (written !== content.byteLength) {
            throw new Error(
                `number of bytes written is not the same as the data: written ${written} bytes, buffer size ${content.byteLength} bytes: ${filepath}`,
            )
        }

        return Ok(written)
    },

    remove: async (
        _: Context,
        { filepath }: { filepath: string },
    ): AsyncResult<void> => {
        let { dir: dirname, filename } = splitFilepath(filepath)
        let dir = await fromPromise(getDirHandle(await _rootDir, dirname))
        if (!dir.ok) {
            return dir
        }

        let removed = await fromPromise(dir.value.removeEntry(filename))
        if (!removed) {
            return fmtErr(`%w: ${filepath}`, removed)
        }

        return removed
    },

    mkdirp: async (
        _: Context,
        { dirpath }: { dirpath: string },
    ): AsyncResult<void> => {
        let curr = await _rootDir
        let dirs = dirpath.split("/")

        for (let dir of dirs) {
            if (dir === "") {
                continue
            }

            let result = await fromPromise(
                curr.getDirectoryHandle(dir, { create: true }),
            )
            if (!result.ok) {
                return fmtErr(`%w: ${dir}`, result)
            }

            curr = result.value
        }

        return Ok(undefined)
    },
})

OPFSWorker.runIfWorker()

async function getDirHandle(
    rootDir: FileSystemDirectoryHandle,
    dirpath: string,
) {
    let curr = rootDir
    let dirs = dirpath.split("/")

    for (let dir of dirs) {
        if (dir === "") {
            continue
        }

        try {
            curr = await curr.getDirectoryHandle(dir)
        } catch (e) {
            let err = e as Error
            throw new Error(`${err.message}: ${dir}: ${err.stack}`, {
                cause: err.cause,
            })
        }
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
        return { dir: ".", filename: filepath }
    }

    let filename = filepath.substring(lastSlashIndex + 1)

    return { dir: dir, filename }
}
