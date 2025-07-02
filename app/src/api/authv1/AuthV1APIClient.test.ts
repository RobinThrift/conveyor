import { http, HttpResponse } from "msw"
import { setupWorker } from "msw/browser"
import { assert, suite, test } from "vitest"

import {
    PasswordChangeRequiredError,
    type PlaintextAuthTokenValue,
    type PlaintextPassword,
} from "@/auth"
import { BaseContext } from "@/lib/context"
import { currentDateTime, isAfter } from "@/lib/i18n"
import { assertErrResult, assertOkResult } from "@/lib/testhelper/assertions"

import { isErr } from "@/lib/errors"
import { UnauthorizedError } from "../apiv1/APIError"
import { AuthV1APIClient } from "./AuthV1APIClient"

suite("api/syncv1/AuthV1APIClient", async () => {
    test("getTokenUsingCredentials/valid", async ({ onTestFinished }) => {
        let { ctx, setup, cleanup, useMocks, authV1APIClient } = await setupAuthV1APIClientTest()

        await setup()
        onTestFinished(cleanup)

        let username = "test_user"
        let password = "passwd"
        let now = currentDateTime()

        useMocks(
            http.post<never, { username: string; password: string; grant_type: "password" }>(
                "/api/auth/v1/token",
                async ({ request }) => {
                    let body = await request.json()
                    assert.equal(body.grant_type, "password")
                    assert.equal(body.username, username)
                    assert.equal(body.password, password)

                    return HttpResponse.json(
                        {
                            accessToken: "MOCK_ACCESS_TOKEN",
                            expiresAt: now.add({ hours: 1 }).toDate("utc"),
                            refreshToken: "MOCK_REFRESH_TOKEN",
                            refreshExpiresAt: now.add({ days: 30 }).toDate("utc"),
                        },
                        { status: 201 },
                    )
                },
            ),
        )

        let token = await assertOkResult(
            authV1APIClient.getTokenUsingCredentials(ctx, {
                username,
                password: password as PlaintextPassword,
            }),
        )

        assert.equal(token.accessToken, "MOCK_ACCESS_TOKEN")
        assert.equal(token.refreshToken, "MOCK_REFRESH_TOKEN")
        assert.isTrue(isAfter(token.expiresAt, now))
        assert.isTrue(isAfter(token.refreshExpiresAt, now))
        assert.isTrue(isAfter(token.refreshExpiresAt, token.expiresAt))
    })

    test("getTokenUsingCredentials/invalid", async ({ onTestFinished }) => {
        let { ctx, setup, cleanup, useMocks, authV1APIClient } = await setupAuthV1APIClientTest()

        await setup()
        onTestFinished(cleanup)

        let username = "test_user"
        let password = "incorrect_password"

        useMocks(
            http.post<never, { refresh_token: string; grant_type: "password" }>(
                "/api/auth/v1/token",
                async ({ request }) => {
                    let body = await request.json()
                    assert.equal(body.grant_type, "password")

                    return HttpResponse.json(
                        {
                            code: 401,
                            type: "conveyor/api/v1/auth/Unauthorized",
                            title: "UnauthorizedError",
                        },
                        { status: 401 },
                    )
                },
            ),
        )

        let err = await assertErrResult(
            authV1APIClient.getTokenUsingCredentials(ctx, {
                username,
                password: password as PlaintextPassword,
            }),
        )
        assert.isTrue(isErr(err, UnauthorizedError))
    })

    test("getTokenUsingCredentials/requiresChange", async ({ onTestFinished }) => {
        let { ctx, setup, cleanup, useMocks, authV1APIClient } = await setupAuthV1APIClientTest()

        await setup()
        onTestFinished(cleanup)

        let username = "test_user"
        let password = "passwd"

        useMocks(
            http.post<never, { username: string; password: string; grant_type: "password" }>(
                "/api/auth/v1/token",
                async ({ request }) => {
                    let body = await request.json()
                    assert.equal(body.grant_type, "password")
                    assert.equal(body.username, username)
                    assert.equal(body.password, password)

                    return new HttpResponse(null, {
                        status: 204,
                        headers: {
                            Location: "/change-password",
                        },
                    })
                },
            ),
        )

        let err = await assertErrResult(
            authV1APIClient.getTokenUsingCredentials(ctx, {
                username,
                password: password as PlaintextPassword,
            }),
        )

        assert.isTrue(isErr(err, PasswordChangeRequiredError))
    })

    test("getTokenUsingRefreshToken/valid", async ({ onTestFinished }) => {
        let { ctx, setup, cleanup, useMocks, authV1APIClient } = await setupAuthV1APIClientTest()

        await setup()
        onTestFinished(cleanup)

        let refreshToken = "TEST_VALID_REFRESH_TOKEN"
        let now = currentDateTime()

        useMocks(
            http.post<never, { refresh_token: string; grant_type: "refresh_token" }>(
                "/api/auth/v1/token",
                async ({ request }) => {
                    let body = await request.json()
                    assert.equal(body.grant_type, "refresh_token")
                    assert.equal(body.refresh_token, refreshToken)

                    return HttpResponse.json(
                        {
                            accessToken: "MOCK_ACCESS_TOKEN",
                            expiresAt: now.add({ hours: 1 }).toDate("utc"),
                            refreshToken: "MOCK_REFRESH_TOKEN",
                            refreshExpiresAt: now.add({ days: 30 }).toDate("utc"),
                        },
                        { status: 201 },
                    )
                },
            ),
        )

        let token = await assertOkResult(
            authV1APIClient.getTokenUsingRefreshToken(ctx, {
                refreshToken: refreshToken as PlaintextAuthTokenValue,
            }),
        )

        assert.equal(token.accessToken, "MOCK_ACCESS_TOKEN")
        assert.equal(token.refreshToken, "MOCK_REFRESH_TOKEN")
        assert.isTrue(isAfter(token.expiresAt, now))
        assert.isTrue(isAfter(token.refreshExpiresAt, now))
        assert.isTrue(isAfter(token.refreshExpiresAt, token.expiresAt))
    })

    test("getTokenUsingRefreshToken/invalid", async ({ onTestFinished }) => {
        let { ctx, setup, cleanup, useMocks, authV1APIClient } = await setupAuthV1APIClientTest()

        await setup()
        onTestFinished(cleanup)

        let refreshToken = "TEST_VALID_REFRESH_TOKEN"

        useMocks(
            http.post<never, { refresh_token: string; grant_type: "refresh_token" }>(
                "/api/auth/v1/token",
                async ({ request }) => {
                    let body = await request.json()
                    assert.equal(body.grant_type, "refresh_token")
                    assert.equal(body.refresh_token, refreshToken)

                    return HttpResponse.json(
                        {
                            code: 401,
                            type: "conveyor/api/v1/auth/Unauthorized",
                            title: "UnauthorizedError",
                        },
                        { status: 401 },
                    )
                },
            ),
        )

        let err = await assertErrResult(
            authV1APIClient.getTokenUsingRefreshToken(ctx, {
                refreshToken: refreshToken as PlaintextAuthTokenValue,
            }),
        )
        assert.isTrue(isErr(err, UnauthorizedError))
    })
})

async function setupAuthV1APIClientTest() {
    let [ctx, cancel] = BaseContext.withCancel()

    let authV1APIClient = new AuthV1APIClient({
        baseURL: globalThis.location.href,
    })

    let mockWorker = setupWorker()

    return {
        ctx,
        setup: async () => {
            await mockWorker.start({
                quiet: true,
            })
        },
        cleanup: async () => {
            cancel()
            mockWorker.stop()
        },
        useMocks: ((...args) => mockWorker.use(...args)) as typeof mockWorker.use,
        authV1APIClient,
    }
}
