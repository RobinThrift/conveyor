import { bech32 } from "@scure/base"

export function privateKeyToDBKey(enckey: string): string {
    if (!enckey.startsWith("AGE-SECRET-KEY-")) {
        throw new Error("unknown private key format")
    }

    let decoded = bech32.decode(enckey as any)

    let dbKey = decoded.words
        .map((c) => c.toString(16))
        .join("")
        .substring(0, 64)

    return dbKey
}
