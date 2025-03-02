export const supportedRegions = ["gb", "us", "de"] as const
export type Region = (typeof supportedRegions)[number]
