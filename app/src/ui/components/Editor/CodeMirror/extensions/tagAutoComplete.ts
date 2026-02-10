import { autocompletion, type Completion, type CompletionContext } from "@codemirror/autocomplete"
import type { Extension } from "@codemirror/state"
import { EditorView } from "@codemirror/view"

import type { Tag } from "@/domain/Tag"

export function tagAutoComplete(tags: Tag[] = []): Extension {
    let completions: Completion[] = tags.map((tag) => ({ label: tag.tag }))

    let extension = autocompletion({
        closeOnBlur: false,
        tooltipClass: () => "text-editor-autocomplete",
        optionClass: () => "text-editor-autocomplete-item",
        override: [
            (context: CompletionContext) => {
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
            },
        ],
    })

    return [
        EditorView.baseTheme({
            ".cm-tooltip": {
                border: "inherit !important",
                "background-color": "inherit !important",
            },
            ".cm-tooltip.cm-tooltip-autocomplete > ul": {
                "font-family": "inherit !important",
            },
            ".cm-completionIcon": {
                display: "none !important",
            },
            ".cm-tooltip-autocomplete ul li[aria-selected]": {
                background: "inherit !important",
                color: "inherit !important",
            },
            ".cm-tooltip.cm-tooltip-autocomplete > ul > li, .cm-tooltip.cm-tooltip-autocomplete > ul > completion-section":
                {
                    padding: "inherit !important",
                    "line-height": "inherit !important",
                },
        }),
        extension,
    ]
}
