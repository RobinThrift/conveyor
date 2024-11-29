import type { Account } from "@/domain/Account"
import type { Settings } from "@/domain/Settings"
import type { ChangePasswordPageProps, LoginPageProps } from "@/pages/Login"
import type { SettingsPageProps } from "@/pages/Settings"

export interface ServerData {
    account: Account
    settings: Settings

    /* Specific component props that need data from the server, e.g. based on the request or errors. */
    components: {
        LoginPage: LoginPageProps
        LoginChangePasswordPage: ChangePasswordPageProps
        SettingsPage: Pick<SettingsPageProps, "validationErrors">
    }

    error?: {
        code: number
        title: string
        detail: string
    }
}

export const serverData: ServerData = JSON.parse(
    // biome-ignore lint/style/noNonNullAssertion: if this is null all is lost anyway
    document.getElementById("__belt_ui_data__")!.innerHTML,
)
