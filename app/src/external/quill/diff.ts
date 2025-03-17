import Delta from "quill-delta"

import type {
    MemoChangelogEntry,
    MemoContentChangesV1,
    MemoContentOpV1,
} from "@/domain/Changelog"

export function applyChanges(
    text: string,
    changes: MemoContentChangesV1,
): string {
    let delta = new Delta(changes.changes)
    let doc = new Delta().insert(text)
    let composed = doc.compose(delta)

    let applied = ""
    composed.forEach((op) => {
        if (op.insert) {
            applied += op.insert
        }
    })

    return applied
}

export function changesToString(changes: MemoContentOpV1[]): string {
    if (changes.length === 0) {
        return ""
    }

    if (changes.length === 1) {
        return (changes[0].insert as string) ?? ""
    }

    let [first, ...rest] = changes
    let doc = new Delta([first])
    let delta = new Delta(rest)
    let composed = doc.compose(delta)

    let applied = ""
    composed.forEach((op) => {
        if (op.insert) {
            applied += op.insert
        }
    })

    return applied
}

export function diff(
    oldContent: string,
    newContent: string,
): MemoContentOpV1[] {
    let oldDoc = new Delta().insert(oldContent)
    let newDoc = new Delta().insert(newContent)

    return oldDoc.diff(newDoc).ops
}

export function mergeDeltas(
    entries: MemoChangelogEntry[],
): MemoContentChangesV1 {
    return {
        version: "1",
        changes: entries.reduce((prev, entry) => {
            if ("created" in entry.value) {
                let inserted = new Delta([
                    { insert: entry.value.created.content },
                ])
                return inserted.compose(inserted.transform(prev))
            }

            if ("content" in entry.value) {
                return prev.compose(
                    prev.transform(new Delta(entry.value.content.changes)),
                )
            }

            return prev
        }, new Delta()).ops,
    }
}
