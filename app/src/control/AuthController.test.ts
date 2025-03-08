import { suite, test, afterAll, assert } from "vitest"

import { BaseContext, type Context } from "@/lib/context"
import { TestInMemAuthStorage } from "@/lib/testhelper/TestInMemAuthStorage"
import { type AsyncResult, Err, Ok } from "@/lib/result"
import type {
    AuthToken,
    PlaintextAuthTokenValue,
    PlaintextPassword,
} from "@/auth"
import { addDays, addHours, currentDateTime } from "@/lib/date"
import { assertErrResult, assertOkResult } from "@/lib/testhelper/assertions"
import { UnauthorizedError } from "@/api/apiv1/APIError"

import { AuthController } from "./AuthController"

suite.concurrent("control/AuthController", async () => {
    suite.concurrent("getInitialToken", async () => {
        let validUsername = "test_getInitialToken_USERNAME"
        let validPassword = "test_getInitialToken_PASSWORD"
        let { ctx, cleanup, authCtrl } = await setupAuthControllerTest({
            authAPIClient: {
                getTokenUsingCredentials: async (_, { username, password }) => {
                    if (
                        username === validUsername &&
                        password === validPassword
                    ) {
                        return Ok<AuthToken>({
                            origin: "belt.dev",
                            accessToken: "MOCK_ACCESS_TOKEN",
                            expiresAt: addHours(new Date(), 5),
                            refreshToken: "MOCK_REFRESH_TOKEN",
                            refreshExpiresAt: addDays(new Date(), 30),
                        })
                    }

                    return Err(new UnauthorizedError(""))
                },
            },
        })
        afterAll(cleanup)

        test("valid", async () => {
            await assertOkResult(
                authCtrl.getInitialToken(ctx, {
                    username: validUsername,
                    password: validPassword,
                }),
            )
        })

        test("invalid", async () => {
            await assertErrResult(
                authCtrl.getInitialToken(ctx, {
                    username: "invalid",
                    password: "password",
                }),
            )
        })
    })

    suite.concurrent("getToken", async () => {
        let now = currentDateTime()
        let validAccessToken = "VALID_ACCESS_TOKEN"
        let validRefreshToken = "VALID_REFRESH_TOKEN"
        let refreshedAccessToken = "REFRESHED_MOCK_ACCESS_TOKEN"
        let refreshedRefreshToken = "REFRESHED_MOCK_REFRESH_TOKEN"
        let authAPIClient: AuthAPIClientMock = {
            getTokenUsingRefreshToken: async (_, { refreshToken }) => {
                if (refreshToken === validRefreshToken) {
                    return Ok<AuthToken>({
                        origin: "belt.dev",
                        accessToken: refreshedAccessToken,
                        expiresAt: addHours(now, 5),
                        refreshToken: refreshedRefreshToken,
                        refreshExpiresAt: addDays(now, 30),
                    })
                }

                return Err(new UnauthorizedError(""))
            },
        }

        test("no current token", async ({ onTestFinished }) => {
            let { ctx, cleanup, authCtrl } = await setupAuthControllerTest({
                authAPIClient,
            })
            onTestFinished(cleanup)

            await assertErrResult(authCtrl.getToken(ctx))
        })

        test("valid current token", async ({ onTestFinished }) => {
            let { ctx, cleanup, authCtrl, storage } =
                await setupAuthControllerTest({
                    authAPIClient,
                })
            onTestFinished(cleanup)

            await storage.saveAuthToken(ctx, {
                origin: "belt.dev",
                accessToken: validAccessToken,
                expiresAt: addHours(now, 1),
                refreshToken: validRefreshToken,
                refreshExpiresAt: addDays(now, 2),
            })

            let token = await assertOkResult(authCtrl.getToken(ctx))

            assert.deepEqual(token, validAccessToken)
        })

        test("expired token, valid refresh token", async ({
            onTestFinished,
        }) => {
            let { ctx, cleanup, authCtrl, storage } =
                await setupAuthControllerTest({
                    authAPIClient,
                })
            onTestFinished(cleanup)

            await storage.saveAuthToken(ctx, {
                origin: "belt.dev",
                accessToken: validAccessToken,
                expiresAt: addHours(now, -5),
                refreshToken: validRefreshToken,
                refreshExpiresAt: addDays(now, 2),
            })

            let token = await assertOkResult(authCtrl.getToken(ctx))

            assert.deepEqual(token, refreshedAccessToken)
        })

        test("expired token, expired refresh token", async ({
            onTestFinished,
        }) => {
            let { ctx, cleanup, authCtrl, storage } =
                await setupAuthControllerTest({
                    authAPIClient,
                })
            onTestFinished(cleanup)

            await storage.saveAuthToken(ctx, {
                origin: "belt.dev",
                accessToken: validAccessToken,
                expiresAt: addHours(now, -5),
                refreshToken: validRefreshToken,
                refreshExpiresAt: addDays(now, -2),
            })

            await assertErrResult(authCtrl.getToken(ctx))
        })

        test("expired token, invalid refresh token", async ({
            onTestFinished,
        }) => {
            let { ctx, cleanup, authCtrl, storage } =
                await setupAuthControllerTest({
                    authAPIClient,
                })
            onTestFinished(cleanup)

            await storage.saveAuthToken(ctx, {
                origin: "belt.dev",
                accessToken: validAccessToken,
                expiresAt: addHours(now, -5),
                refreshToken: "INVALID_REFRESH_TOKEN",
                refreshExpiresAt: addDays(now, 2),
            })

            await assertErrResult(authCtrl.getToken(ctx))
        })
    })
})

interface AuthAPIClientMock {
    getTokenUsingCredentials?: (
        ctx: Context,
        creds: { username: string; password: PlaintextPassword },
    ) => AsyncResult<AuthToken>
    getTokenUsingRefreshToken?: (
        ctx: Context,
        token: { refreshToken: PlaintextAuthTokenValue },
    ) => AsyncResult<AuthToken>
}

async function setupAuthControllerTest({
    authAPIClient,
}: {
    authAPIClient?: AuthAPIClientMock
} = {}) {
    let [ctx, cancel] = BaseContext.withCancel()

    let storage = new TestInMemAuthStorage()

    let authCtrl = new AuthController({
        origin: "belt.dev",
        storage,
        authPIClient: {
            getTokenUsingCredentials:
                authAPIClient?.getTokenUsingCredentials ??
                (async () =>
                    Err(new Error("getTokenUsingCredentials unimplemented"))),
            getTokenUsingRefreshToken:
                authAPIClient?.getTokenUsingRefreshToken ??
                (async () =>
                    Err(new Error("getTokenUsingRefreshToken unimplemented"))),
        },
    })

    return {
        ctx,
        cleanup: () => {
            cancel()
        },
        authCtrl,
        storage,
    }
}
