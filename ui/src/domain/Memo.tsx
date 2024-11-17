export type MemoID = string

export interface Memo {
    id: MemoID
    content: string
    isArchived: boolean
    createdAt: Date
    updatedAt: Date
}

export interface MemoList {
    items: Memo[]
    next?: Date
}
