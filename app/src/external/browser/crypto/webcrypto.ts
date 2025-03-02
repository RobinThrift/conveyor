import { encodeText } from "@/lib/textencoding"

export type CryptoKey = globalThis.CryptoKey

const SALT_LEN = 32
const IV_LEN = 12

export async function createKeyFromPassword(
    passwd: string,
): Promise<CryptoKey> {
    return globalThis.crypto.subtle.importKey(
        "raw",
        encodeText(passwd),
        "PBKDF2",
        false,
        ["deriveKey"],
    )
}

export async function calcSha256Hash(data: BufferSource): Promise<ArrayBuffer> {
    return globalThis.crypto.subtle.digest("SHA-256", data)
}

export async function encryptData(
    base: CryptoKey,
    data: Uint8Array,
): Promise<ArrayBufferLike> {
    let salt = generateSalt()
    let iv = generateIV()
    let key = await deriveKey(base, salt)

    let encrypted = await globalThis.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        data,
    )

    let buf = new SharedArrayBuffer(
        salt.byteLength + iv.byteLength + encrypted.byteLength,
    )
    let bufarr = new Uint8Array(buf)
    bufarr.set(salt, 0)
    bufarr.set(iv, salt.byteLength)
    bufarr.set(new Uint8Array(encrypted), salt.byteLength + iv.byteLength)

    return buf
}

export async function decryptData(
    base: CryptoKey,
    data: Uint8Array,
): Promise<ArrayBufferLike> {
    const salt = data.slice(0, SALT_LEN)
    const iv = data.slice(SALT_LEN, SALT_LEN + IV_LEN)
    const encrypted = data.slice(SALT_LEN + IV_LEN)
    let key = await deriveKey(base, salt)

    let decrypted = await globalThis.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        encrypted,
    )

    return decrypted
}

function generateSalt() {
    return globalThis.crypto.getRandomValues(new Uint8Array(SALT_LEN))
}

function generateIV() {
    return globalThis.crypto.getRandomValues(new Uint8Array(IV_LEN))
}

function deriveKey(base: CryptoKey, salt: Uint8Array<ArrayBuffer>) {
    return globalThis.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 250000,
            hash: "SHA-256",
        },
        base,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
    )
}
