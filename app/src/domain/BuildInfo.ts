declare const __VERSION__: string
declare const __COMMIT_HASH__: string
declare const __COMMIT_DATE__: string
declare const __PROJECT_LINK__: string
// declare const __LOG_LEVEL__: string

export interface BuildInfo {
    version: string
    commitHash: string
    commitDate: string
    projectLink: string
}

export const BUILD_INFO: BuildInfo = {
    version: __VERSION__,
    commitHash: __COMMIT_HASH__,
    commitDate: __COMMIT_DATE__,
    projectLink: __PROJECT_LINK__,
}
