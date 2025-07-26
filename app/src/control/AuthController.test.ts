import { afterAll, assert, suite, test } from "vitest"

import { UnauthorizedError } from "@/api/apiv1/APIError"
import {
    type AuthToken,
    AuthTokenNotFoundError,
    type PlaintextAuthTokenValue,
    type PlaintextPassword,
} from "@/auth"
import { BaseContext, type Context } from "@/lib/context"
import { currentDateTime } from "@/lib/i18n"
import { type AsyncResult, Err, Ok } from "@/lib/result"
import { assertErrResult, assertOkResult } from "@/lib/testhelper/assertions"
import { TestInMemKVStore } from "@/lib/testhelper/TestInMemKVStore"
import { AuthController } from "./AuthController"

suite("control/AuthController", async () => {
    suite("getInitialToken", async () => {
        let validUsername = "test_getInitialToken_USERNAME"
        let validPassword = "test_getInitialToken_PASSWORD"
        let { ctx, cleanup, authCtrl } = await setupAuthControllerTest({
            authAPIClient: {
                getTokenUsingCredentials: async (_, { username, password }) => {
                    if (username === validUsername && password === validPassword) {
                        return Ok<AuthToken>({
                            origin: "conveyor.dev",
                            accessToken: "MOCK_ACCESS_TOKEN" as PlaintextAuthTokenValue,
                            expiresAt: currentDateTime().add({ hours: 5 }).toDate("utc"),
                            refreshToken: "MOCK_REFRESH_TOKEN" as PlaintextAuthTokenValue,
                            refreshExpiresAt: currentDateTime().add({ days: 30 }).toDate("utc"),
                        })
                    }

                    return Err(new UnauthorizedError())
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

    suite("getToken", async () => {
        let now = currentDateTime()
        let validAccessToken = "VALID_ACCESS_TOKEN"
        let validRefreshToken = "VALID_REFRESH_TOKEN"
        let refreshedAccessToken = "REFRESHED_MOCK_ACCESS_TOKEN"
        let refreshedRefreshToken = "REFRESHED_MOCK_REFRESH_TOKEN"
        let authAPIClient: AuthAPIClientMock = {
            getTokenUsingRefreshToken: async (_, { refreshToken }) => {
                if (refreshToken === validRefreshToken) {
                    return Ok<AuthToken>({
                        origin: "conveyor.dev",
                        accessToken: refreshedAccessToken as PlaintextAuthTokenValue,
                        expiresAt: now.add({ hours: 5 }).toDate("utc"),
                        refreshToken: refreshedRefreshToken as PlaintextAuthTokenValue,
                        refreshExpiresAt: now.add({ days: 30 }).toDate("utc"),
                    })
                }

                return Err(new UnauthorizedError())
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
            let { ctx, cleanup, authCtrl, storage } = await setupAuthControllerTest({
                authAPIClient,
            })
            onTestFinished(cleanup)

            await storage.setItem(ctx, "conveyor.dev", {
                origin: "conveyor.dev",
                accessToken: validAccessToken as PlaintextAuthTokenValue,
                expiresAt: now.add({ hours: 1 }).toDate("utc"),
                refreshToken: validRefreshToken as PlaintextAuthTokenValue,
                refreshExpiresAt: now.add({ days: 2 }).toDate("utc"),
            })

            let token = await assertOkResult(authCtrl.getToken(ctx))

            assert.deepEqual(token, validAccessToken)
        })

        test("expired token, valid refresh token", async ({ onTestFinished }) => {
            let { ctx, cleanup, authCtrl, storage } = await setupAuthControllerTest({
                authAPIClient,
            })
            onTestFinished(cleanup)

            await storage.setItem(ctx, "conveyor.dev", {
                origin: "conveyor.dev",
                accessToken: validAccessToken as PlaintextAuthTokenValue,
                expiresAt: now.subtract({ hours: 5 }).toDate("utc"),
                refreshToken: validRefreshToken as PlaintextAuthTokenValue,
                refreshExpiresAt: now.add({ days: 2 }).toDate("utc"),
            })

            let token = await assertOkResult(authCtrl.getToken(ctx))

            assert.deepEqual(token, refreshedAccessToken)
        })

        test("expired token, expired refresh token", async ({ onTestFinished }) => {
            let { ctx, cleanup, authCtrl, storage } = await setupAuthControllerTest({
                authAPIClient,
            })
            onTestFinished(cleanup)

            await storage.setItem(ctx, "conveyor.dev", {
                origin: "conveyor.dev",
                accessToken: validAccessToken as PlaintextAuthTokenValue,
                expiresAt: now.subtract({ hours: 5 }).toDate("utc"),
                refreshToken: validRefreshToken as PlaintextAuthTokenValue,
                refreshExpiresAt: now.subtract({ days: 2 }).toDate("utc"),
            })

            await assertErrResult(authCtrl.getToken(ctx))
        })

        test("expired token, invalid refresh token", async ({ onTestFinished }) => {
            let { ctx, cleanup, authCtrl, storage } = await setupAuthControllerTest({
                authAPIClient,
            })
            onTestFinished(cleanup)

            await storage.setItem(ctx, "conveyor.dev", {
                origin: "conveyor.dev",
                accessToken: validAccessToken as PlaintextAuthTokenValue,
                expiresAt: now.subtract({ hours: 5 }).toDate("utc"),
                refreshToken: "INVALID_REFRESH_TOKEN" as PlaintextAuthTokenValue,
                refreshExpiresAt: now.add({ days: 2 }).toDate("utc"),
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

    let storage = new TestInMemKVStore<
        {
            [key: string]: AuthToken
        },
        AuthTokenNotFoundError
    >({ NotFoundErr: AuthTokenNotFoundError })

    let authCtrl = new AuthController({
        origin: "conveyor.dev",
        storage,
        authPIClient: {
            setBaseURL: () => {},
            getTokenUsingCredentials:
                authAPIClient?.getTokenUsingCredentials ??
                (async () => Err(new Error("getTokenUsingCredentials unimplemented"))),
            getTokenUsingRefreshToken:
                authAPIClient?.getTokenUsingRefreshToken ??
                (async () => Err(new Error("getTokenUsingRefreshToken unimplemented"))),
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
