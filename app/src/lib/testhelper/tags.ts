import { faker } from "@faker-js/faker"

import type { Tag } from "@/domain/Tag"

export function generateMockTags() {
    let tags: Tag[] = []

    for (let i = 0; i < 100; i++) {
        tags.push({
            tag: `${faker.word.noun()}/${faker.word.noun()}`,
            count: 0,
        })
    }

    tags.sort()

    return tags
}
