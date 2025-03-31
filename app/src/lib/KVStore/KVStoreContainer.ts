import type { KVStore } from "./KVStore"

export interface KVStoreContainer<Names extends string> {
    getKVStore<
        Items extends Record<string, unknown>,
        _NotFoundError extends Error = never,
        Opts extends Record<string, unknown> = never,
    >(name: Names, opts?: Opts): KVStore<Items>
}
