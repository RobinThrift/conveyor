import type { ChangePasswordPageProps, LoginPageProps } from "@/pages/Login"

export interface ServerData {
    /* Specific component props that need data from the server, e.g. based on the request or errors. */
    components: {
        LoginPage: LoginPageProps
        LoginChangePasswordPage: ChangePasswordPageProps
    }

    error?: {
        code: number
        title: string
        detail: string
    }
}
