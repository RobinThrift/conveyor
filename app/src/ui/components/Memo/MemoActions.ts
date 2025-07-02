import type { MemoID } from "@/domain/Memo"

export interface MemoActions {
    edit: (memoID: MemoID, position?: { x: number; y: number; snippet?: string }) => void
    archive: (memoID: MemoID, isArchived: boolean) => void
    delete: (memoID: MemoID, isDeleted: boolean) => void
}
