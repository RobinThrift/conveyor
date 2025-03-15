import { assert, afterAll, suite, test } from "vitest"

import { UnauthorizedError } from "@/api/apiv1/APIError"
import type {
    AuthToken,
    PlaintextAuthTokenValue,
    PlaintextPassword,
} from "@/auth"
import { BaseContext, type Context } from "@/lib/context"
import { addDays, addHours, currentDateTime } from "@/lib/date"
import { type AsyncResult, Err, Ok } from "@/lib/result"
import { TestInMemAuthStorage } from "@/lib/testhelper/TestInMemAuthStorage"
import { assertErrResult, assertOkResult } from "@/lib/testhelper/assertions"

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
                            accessToken:
                                "MOCK_ACCESS_TOKEN" as PlaintextAuthTokenValue,
                            expiresAt: addHours(new Date(), 5),
                            refreshToken:
                                "MOCK_REFRESH_TOKEN" as PlaintextAuthTokenValue,
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
                    password: validPassword as PlaintextPassword,
                }),
            )
        })

        test("invalid", async () => {
            await assertErrResult(
                authCtrl.getInitialToken(ctx, {
                    username: "invalid",
                    password: "password" as PlaintextPassword,
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
                        accessToken:
                            refreshedAccessToken as PlaintextAuthTokenValue,
                        expiresAt: addHours(now, 5),
                        refreshToken:
                            refreshedRefreshToken as PlaintextAuthTokenValue,
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
                accessToken: validAccessToken as PlaintextAuthTokenValue,
                expiresAt: addHours(now, 1),
                refreshToken: validRefreshToken as PlaintextAuthTokenValue,
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
                accessToken: validAccessToken as PlaintextAuthTokenValue,
                expiresAt: addHours(now, -5),
                refreshToken: validRefreshToken as PlaintextAuthTokenValue,
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
                accessToken: validAccessToken as PlaintextAuthTokenValue,
                expiresAt: addHours(now, -5),
                refreshToken: validRefreshToken as PlaintextAuthTokenValue,
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
                accessToken: validAccessToken as PlaintextAuthTokenValue,
                expiresAt: addHours(now, -5),
                refreshToken:
                    "INVALID_REFRESH_TOKEN" as PlaintextAuthTokenValue,
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
    changePassword?: (
        ctx: Context,
        creds: {
            username: string
            currentPassword: PlaintextPassword
            newPassword: PlaintextPassword
            newPasswordRepeat: PlaintextPassword
        },
    ) => AsyncResult<void>
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
            setBaseURL: () => {},
            getTokenUsingCredentials:
                authAPIClient?.getTokenUsingCredentials ??
                (async () =>
                    Err(new Error("getTokenUsingCredentials unimplemented"))),
            getTokenUsingRefreshToken:
                authAPIClient?.getTokenUsingRefreshToken ??
                (async () =>
                    Err(new Error("getTokenUsingRefreshToken unimplemented"))),
            changePassword:
                authAPIClient?.changePassword ??
                (async () => Err(new Error("changePassword unimplemented"))),
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
