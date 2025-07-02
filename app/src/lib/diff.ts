import type { MemoChangelogEntry, MemoContentChanges, MemoContentOpV1 } from "@/domain/Changelog"
import { changesToString, mergeDeltas } from "@/external/quill"

export { diff as calculateDiff } from "@/external/quill"

export function mergeChanges(entries: MemoChangelogEntry[]): MemoContentChanges {
    return mergeDeltas(entries)
}

export function resolveChanges(changes: MemoContentOpV1[]): string {
    return changesToString(changes)
}
