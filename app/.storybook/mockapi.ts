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
                    headers: {
                        "content-type": "application/json; charset=utf-8",
                    },
                },
            )
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
]
