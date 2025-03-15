import { http, type HttpHandler, HttpResponse, delay } from "msw"
import { addHours } from "date-fns"

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
                    expiresAt: addHours(new Date(), 1),
                    refreshExpiresAt: addHours(new Date(), 5),
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

        if (
            body.grant_type === "refresh_token" &&
            body.refresh_token === "VALID_REFRESH_TOKEN"
        ) {
            return HttpResponse.json(
                {
                    accessToken: "VALID_ACCESS_TOKEN",
                    expiresAt: addHours(new Date(), 1),
                    refreshExpiresAt: addHours(new Date(), 5),
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
]
