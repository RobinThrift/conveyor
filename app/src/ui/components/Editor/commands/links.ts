import { EditorSelection } from "@codemirror/state"
import type { EditorView } from "@codemirror/view"

import { fetchOpenGraphData } from "@/lib/opengraph"
import { fromThrowing } from "@/lib/result"

export async function insertLink(
    view: EditorView,
    { from, to, uri }: { from: number; to: number; uri: string },
) {
    let link = await constructLink(uri)

    view.dispatch({
        changes: {
            from,
            to,
            insert: link,
        },
        selection: from === to ? EditorSelection.cursor(from + link.length) : undefined,
    })
}

export function wrapAsLink(view: EditorView) {
    let from = view.state.selection.main.from
    let to = view.state.selection.main.to

    if (from === to) {
        let word = view.state.wordAt(from)
        from = word?.from ?? from
        to = word?.to ?? to
    }

    view.dispatch({
        changes: [
            { from: from, insert: "[" },
            { from: to, insert: "]()" },
        ],
        selection: EditorSelection.cursor(to + 3),
    })
}

async function constructLink(uri: string) {
    let [url, err] = fromThrowing(() => new URL(uri))
    if (err) {
        return `[Link](${uri})`
    }

    let [ogd, ogdErr] = await fetchOpenGraphData(url)
    if (ogdErr || !ogd) {
        return `[${url.host}${url.pathname}](${uri})`
    }

    if (ogd?.imageURL) {
        return `/// link-preview
[${ogd?.title}](${uri})

![](${ogd.imageURL})


${ogd.description}
///`
    }

    return `[${ogd?.title}](${uri})`
}
