import type { APIToken } from "@/domain/APIToken"
import { currentDateTime } from "@/lib/i18n"

export function generateMockAPITokens(n = 100): APIToken[] {
    let now = currentDateTime()
    let apitokens: APIToken[] = []

    for (let i = 0; i < n; i++) {
        apitokens.push({
            name: `Token_${i}`,
            createdAt: now.subtract({ hours: i * 2 }).withTimeZone("utc"),
            expiresAt: now.add({ hours: 5 }).subtract({ days: i }).withTimeZone("utc"),
        })
    }

    return apitokens
}
