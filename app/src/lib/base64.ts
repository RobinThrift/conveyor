import { Err, Ok, type Result } from "./result"

export function encodeToBase64(data: ArrayBuffer | Uint8Array<ArrayBufferLike>): string {
    let arr: Uint8Array<ArrayBufferLike>

    if (data instanceof ArrayBuffer) {
        arr = new Uint8Array(data)
    } else {
        arr = data
    }

    if (arr instanceof Uint8Array && "toBase64" in arr && typeof arr.toBase64 === "function") {
        return arr.toBase64() as string
    }

    return btoa(String.fromCharCode(...arr))
}

export function dataFromBase64(data: string): Result<Uint8Array<ArrayBuffer>> {
    if ("fromBase64" in Uint8Array && typeof Uint8Array.fromBase64 === "function") {
        try {
            return Ok(Uint8Array.fromBase64(data) as Uint8Array<ArrayBuffer>)
        } catch (err) {
            return Err(err as Error)
        }
    }

    return Ok(
        new Uint8Array(
            atob(data)
                .split("")
                .map((x) => x.charCodeAt(0)),
        ),
    )
}
