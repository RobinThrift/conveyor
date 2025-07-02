import type { Context } from "@/lib/context"
import type { AsyncResult } from "@/lib/result"

export interface KVStore<Items extends Record<string, unknown>> {
    getItem<K extends keyof Items>(ctx: Context, key: K): AsyncResult<Items[K] | undefined>
    setItem<K extends keyof Items>(ctx: Context, key: K, value: Items[K]): AsyncResult<void>
    removeItem<K extends keyof Items>(ctx: Context, key: K): AsyncResult<void>
    clear(ctx: Context): AsyncResult<void>
}
