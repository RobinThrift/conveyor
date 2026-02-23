import { autocompletion, type CompletionSource } from "@codemirror/autocomplete"
import type { Extension } from "@codemirror/state"
import { EditorView } from "@codemirror/view"

export function autocomplete(sources: CompletionSource[] = []): Extension {
    let extension = autocompletion({
        closeOnBlur: false,
        tooltipClass: () => "text-editor-autocomplete",
        optionClass: () => "text-editor-autocomplete-item",
        override: sources,
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
