export type SetupInfo = IsNotSetupInfo | IsSetupInfo

export interface IsNotSetupInfo {
    isSetup: false
}

export interface IsSetupInfo {
    isSetup: true
    version: string
    setupAt: Date
}
