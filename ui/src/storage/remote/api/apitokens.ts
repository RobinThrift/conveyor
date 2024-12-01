import { APIError } from "@/api/APIError"
import type { Pagination } from "@/api/pagination"
import type { APITokenList } from "@/domain/APIToken"

export async function list({
    pagination,
    baseURL = "",
    signal,
}: {
    pagination: Pagination<string>
    baseURL?: string
    signal?: AbortSignal
}): Promise<APITokenList> {
    let url = new URL(`${baseURL}/api/v1/apitokens`, globalThis.location.href)
    url.searchParams.set("page[size]", `${pagination.pageSize}`)

    if (pagination.after) {
        url.searchParams.set("page[after]", `${pagination.after}`)
    }

    let res = await fetch(url, { signal })

    if (!res.ok) {
        throw new Error(
            `unknown error fetching API Token list: ${res.status} ${res.statusText}`,
        )
    }

    if (res.status !== 200) {
        let err = await APIError.fromHTTPResponse(res)
        throw err.withPrefix("error fetching API Token list")
    }

    let list = (await res.json()) as APITokenList

    list.items = list.items.map((memo) => ({
        ...memo,
        createdAt: new Date(memo.createdAt),
        expiresAt: new Date(memo.expiresAt),
    }))

    return list
}

export interface CreateAPITokenRequest {
    name: string
    expiresAt: Date
}

export async function create({
    token,
    signal,
    baseURL = "",
}: {
    token: CreateAPITokenRequest
    baseURL?: string
    signal?: AbortSignal
}): Promise<{ token: string }> {
    let url = new URL(`${baseURL}/api/v1/apitokens`, globalThis.location.href)

    let res = await fetch(url, {
        signal,
        method: "POST",
        body: JSON.stringify(token),
    })

    if (!res.ok) {
        throw new Error(
            `unknown error creating API Token: ${res.status} ${res.statusText}`,
        )
    }

    if (res.status !== 201) {
        let err = await APIError.fromHTTPResponse(res)
        throw err.withPrefix("error creating memo")
    }

    return res.json()
}

export async function del({
    name,
    signal,
    baseURL = "",
}: {
    name: string
    baseURL?: string
    signal?: AbortSignal
}): Promise<void> {
    let url = new URL(
        `${baseURL}/api/v1/apitokens/${name}`,
        globalThis.location.href,
    )

    let res = await fetch(url, {
        signal,
        method: "DELETE",
    })

    if (!res.ok) {
        throw new Error(
            `unknown error deleting API Token: ${res.status} ${res.statusText}`,
        )
    }

    if (res.status !== 204) {
        let err = await APIError.fromHTTPResponse(res)
        throw err.withPrefix("error deleting API Token")
    }
}
