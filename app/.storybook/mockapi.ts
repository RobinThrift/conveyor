import { delay, type HttpHandler, HttpResponse, http } from "msw"

import type { CreateAPITokenRequest } from "../src/control/APITokenController"
import type { APIToken, APITokenList } from "../src/domain/APIToken"
import { currentDateTime } from "../src/lib/i18n/datetime"
import { parseJSONDate } from "../src/lib/json"
import { generateMockAPITokens } from "../src/lib/testhelper/apitokens"

interface MockData {
    apitokens: (APIToken & { id: number })[]
}

let mockData: MockData = {
    apitokens: generateMockAPITokens().map((t, i) => ({
        id: i,
        ...t,
    })),
}

export const mockAPI: HttpHandler[] = [
    http.post<
        never,
        | { grant_type: "password"; username: string; password: string }
        | { grant_type: "refresh_token"; refresh_token: string }
    >("/api/auth/v1/token", async ({ request }) => {
        await delay(500)

        let body = await request.json()
        if (
            body.grant_type === "password" &&
            body.username === "test" &&
            body.password === "passwd"
        ) {
            return HttpResponse.json(
                {
                    accessToken: "VALID_ACCESS_TOKEN",
                    expiresAt: currentDateTime().add({ hours: 1 }).withTimeZone("utc"),
                    refreshExpiresAt: currentDateTime().add({ hours: 5 }).withTimeZone("utc"),
                    refreshToken: "VALID_REFRESH_TOKEN",
                },
                {
                    status: 201,
                    headers: {
                        "content-type": "application/json; charset=utf-8",
                    },
                },
            )
        }

        if (
            body.grant_type === "password" &&
            body.username === "change" &&
            body.password === "passwd"
        ) {
            return new HttpResponse(null, {
                status: 204,
                headers: {
                    Location: "/change-password",
                },
            })
        }

        if (body.grant_type === "refresh_token" && body.refresh_token === "VALID_REFRESH_TOKEN") {
            return HttpResponse.json(
                {
                    accessToken: "VALID_ACCESS_TOKEN",
                    expiresAt: currentDateTime().add({ hours: 1 }).withTimeZone("utc"),
                    refreshExpiresAt: currentDateTime().add({ hours: 5 }).withTimeZone("utc"),
                    refreshToken: "VALID_REFRESH_TOKEN",
                },
                {
                    status: 201,
                    headers: {
                        "content-type": "application/json; charset=utf-8",
                    },
                },
            )
        }

        return HttpResponse.json(
            {
                code: 401,
                type: "belt/api/v1/auth/Unauthorized",
                title: "Unauthorized",
            },
            {
                status: 401,
                statusText: "Unauthorized",
                headers: {
                    "content-type": "application/json; charset=utf-8",
                },
            },
        )
    }),

    http.post<
        never,
        {
            username: string
            currentPassword: string
            newPassword: string
            newPasswordRepeat: string
        }
    >("/api/auth/v1/change-password", async ({ request }) => {
        await delay(500)

        let body = await request.json()

        if (body.username !== "change" && body.username !== "test") {
            return HttpResponse.json(
                {
                    code: 401,
                    type: "belt/api/v1/auth/Unauthorized",
                    title: "Unauthorized",
                },
                {
                    status: 401,
                    statusText: "Unauthorized",
                    headers: {
                        "content-type": "application/json; charset=utf-8",
                    },
                },
            )
        }

        if (body.currentPassword !== "passwd") {
            return HttpResponse.json(
                {
                    code: 401,
                    type: "belt/api/v1/auth/Unauthorized",
                    title: "Unauthorized",
                },
                {
                    status: 401,
                    statusText: "Unauthorized",
                    headers: {
                        "content-type": "application/json; charset=utf-8",
                    },
                },
            )
        }

        if (body.newPassword !== body.newPasswordRepeat) {
            return HttpResponse.json(
                {
                    code: 400,
                    type: "belt/api/v1/auth/BadRequest",
                    title: "NewPasswordsDoNotMatch",
                },
                {
                    status: 400,
                    statusText: "BadRequest",
                    headers: {
                        "content-type": "application/json; charset=utf-8",
                    },
                },
            )
        }

        if (body.newPassword === body.currentPassword) {
            return HttpResponse.json(
                {
                    code: 400,
                    type: "belt/api/v1/auth/BadRequest",
                    title: "NewPasswordIsOldPassword",
                },
                {
                    status: 400,
                    statusText: "BadRequest",
                    headers: {
                        "content-type": "application/json; charset=utf-8",
                    },
                },
            )
        }

        if (body.username === "change" && body.currentPassword === "passwd") {
            return new HttpResponse(null, { status: 204 })
        }

        return new HttpResponse(null, {
            status: 204,
            headers: {
                Location: "/change-password",
            },
        })
    }),

    http.get("/api/auth/v1/apitokens", async ({ request }) => {
        await delay(500)

        let url = new URL(request.url)

        let pageSize = Number.parseInt(url.searchParams.get("page[size]") ?? "100", 10)
        let after = Number.parseInt(url.searchParams.get("page[after]") ?? "-1", 10)

        let apitokens: APIToken[] = []
        let take = after === -1
        let next = ""

        for (let token of mockData.apitokens) {
            take = take || token.id > after
            if (!take) {
                continue
            }

            if (apitokens.length >= pageSize) {
                next = token.id.toString()
                break
            }

            apitokens.push(token)
        }

        return HttpResponse.json(
            {
                items: apitokens,
                next: next ? next : undefined,
            } satisfies APITokenList,
            { headers: { "content-type": "application/json; charset=utf-8" } },
        )
    }),

    http.post<never, CreateAPITokenRequest>("/api/auth/v1/apitokens", async ({ request }) => {
        await delay(500)

        let body = await request.json()

        let now = new Date()
        let token: APIToken = {
            name: body.name,
            createdAt: now,
            expiresAt: parseJSONDate(body.expiresAt as any),
        }

        mockData.apitokens = [{ id: mockData.apitokens.length, ...token }, ...mockData.apitokens]

        return HttpResponse.json(
            { token: body.name },
            {
                status: 201,
                headers: {
                    "content-type": "application/json; charset=utf-8",
                },
            },
        )
    }),

    http.delete<{ name: string }>("/api/auth/v1/apitokens/:name", async ({ params }) => {
        await delay(500)

        let index = mockData.apitokens.findIndex((a) => a.name === params.name)
        if (index === -1) {
            return new HttpResponse(null, {
                status: 204,
            })
        }

        mockData.apitokens.splice(index, 1)

        return new HttpResponse(null, {
            status: 204,
        })
    }),

    http.post<never, CreateAPITokenRequest>("/api/sync/v1/clients", async ({ request }) => {
        await delay(500)

        await request.json()

        return new HttpResponse(null, {
            status: 201,
        })
    }),
]
