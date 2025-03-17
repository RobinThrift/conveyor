export interface ServerData {
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
