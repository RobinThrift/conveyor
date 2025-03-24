export const PrimaryAccountKeyName = "primary"

export const AgeV1AccountKeyType = "agev1"

export interface AccountKey {
    name: string
    type: string
    data: ArrayBuffer
}
