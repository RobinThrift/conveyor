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
