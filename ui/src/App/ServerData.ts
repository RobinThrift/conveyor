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

    buildInfo: BuildInfo
}

export interface BuildInfo {
    version: string
    commitHash: string
    commitDate: string
    projectLink: string
    goVersion: string
}

let _serverData: ServerData = undefined as any

function loadServerData(): ServerData {
    if (!_serverData) {
        _serverData = JSON.parse(
            // biome-ignore lint/style/noNonNullAssertion: if this is null all is lost anyway
            document.getElementById("__belt_ui_data__")!.innerHTML,
        )
    }

    return _serverData
}

export const serverData = new Proxy(
    {},
    {
        get: (_, key: keyof ServerData) => loadServerData()[key],
        ownKeys: () => Object.getOwnPropertyNames(loadServerData()),
        getOwnPropertyDescriptor: (_, key: keyof ServerData) => ({
            value: loadServerData()[key],
            enumerable: true,
            configurable: true,
        }),
    },
) as ServerData
