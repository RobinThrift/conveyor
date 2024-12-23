import type { APITokenList } from "@/domain/APIToken"
import type { Pagination } from "@/domain/Pagination"
import { APIError, UnauthorizedError } from "./APIError"

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

    if (res.status === 401) {
        throw new UnauthorizedError("error fetching API Token list")
    }

    if (res.status !== 200) {
        let err = await APIError.fromHTTPResponse(res)
        throw err.withPrefix("error fetching API Token list")
    }

    if (!res.ok) {
        throw new Error(
            `unknown error fetching API Token list: ${res.status} ${res.statusText}`,
        )
    }

    let list = (await res.json()) as APITokenList

    list.items = list.items.map((token) => ({
        ...token,
        createdAt: new Date(token.createdAt),
        expiresAt: new Date(token.expiresAt),
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

    if (res.status === 401) {
        throw new UnauthorizedError("error creating API Token")
    }

    if (res.status !== 201) {
        let err = await APIError.fromHTTPResponse(res)
        throw err.withPrefix("error creating API Token")
    }

    if (!res.ok) {
        throw new Error(
            `unknown error creating API Token: ${res.status} ${res.statusText}`,
        )
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

    if (res.status === 401) {
        throw new UnauthorizedError("error deleting API Token")
    }

    if (res.status !== 204) {
        let err = await APIError.fromHTTPResponse(res)
        throw err.withPrefix("error deleting API Token")
    }

    if (!res.ok) {
        throw new Error(
            `unknown error deleting API Token: ${res.status} ${res.statusText}`,
        )
    }
}
