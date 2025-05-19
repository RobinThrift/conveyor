declare const __VERSION__: string
declare const __COMMIT_HASH__: string
declare const __COMMIT_DATE__: string
declare const __PROJECT_LINK__: string

export interface BuildInfo {
    version: string
    commitHash: string
    commitDate: string
    projectLink: string

    server?: ServerBuildInfo
}

type ServerBuildInfo = {
    version: string
    commitHash: string
    commitDate: string
    goVersion: string
}

export const BUILD_INFO: BuildInfo = {
    version: __VERSION__,
    commitHash: __COMMIT_HASH__,
    commitDate: __COMMIT_DATE__,
    projectLink: __PROJECT_LINK__,

    server: new Proxy(
        {},
        {
            get: (_, key: keyof ServerBuildInfo) => loadServerBuildInfo()[key],
            ownKeys: () => Object.getOwnPropertyNames(loadServerBuildInfo()),
            getOwnPropertyDescriptor: (_, key: keyof ServerBuildInfo) => ({
                value: loadServerBuildInfo()[key],
                enumerable: true,
                configurable: true,
            }),
        },
    ) as ServerBuildInfo,
}

let _serverBuildInfo: ServerBuildInfo = undefined as any

function loadServerBuildInfo(): ServerBuildInfo {
    if (!_serverBuildInfo) {
        _serverBuildInfo = JSON.parse(
            // biome-ignore lint/style/noNonNullAssertion: if this is null all is lost anyway
            document.getElementById("__conveyor_ui_data__")!.innerHTML,
        )?.buildInfo
    }

    return _serverBuildInfo
}
