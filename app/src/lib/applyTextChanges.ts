import type { MemoContentChanges } from "@/domain/Changelog"
import { applyChangeSetJSON } from "@/external/codemirror/document"

export function applyTextChanges(
    base: string,
    changes: MemoContentChanges,
): string {
    return applyChangeSetJSON(base, changes.changes)
}
