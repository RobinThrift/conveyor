import type { Completion, CompletionContext, CompletionSource } from "@codemirror/autocomplete"

import type { Tag } from "@/domain/Tag"

export function tagAutoCompleteSource(tags: Tag[] = []): CompletionSource {
    let completions: Completion[] = tags.map((tag) => ({ label: tag.tag }))

    return (context: CompletionContext) => {
        let word = context.matchBefore(/#([\w/]+)/)

        if (!word) {
            return null
        }

        if (word && word.from === word.to && !context.explicit) {
            return null
        }

        return {
            from: word?.from,
            options: completions,
        }
    }
}
