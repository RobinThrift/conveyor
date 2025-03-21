import type { APIToken } from "@/domain/APIToken"
import { add, currentDateTime, sub } from "@/lib/date"

export function generateMockAPITokens(n = 100): APIToken[] {
    let now = currentDateTime()
    let apitokens: APIToken[] = []

    for (let i = 0; i < n; i++) {
        apitokens.push({
            name: `Token_${i}`,
            createdAt: sub(now, { hours: i * 2 }),
            expiresAt: sub(add(now, { hours: 5 }), { days: i }),
        })
    }

    return apitokens
}
