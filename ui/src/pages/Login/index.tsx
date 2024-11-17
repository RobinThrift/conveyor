import { lazy } from "react"

export type { LoginPageProps } from "./LoginPage"
export type { ChangePasswordPageProps } from "./ChangePasswordPage"

export const LoginPage = lazy(() =>
    import("./LoginPage").then(({ LoginPage }) => ({ default: LoginPage })),
)

export const ChangePasswordPage = lazy(() =>
    import("./ChangePasswordPage").then(({ ChangePasswordPage }) => ({
        default: ChangePasswordPage,
    })),
)
