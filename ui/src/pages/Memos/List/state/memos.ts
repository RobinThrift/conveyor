import type { CreateMemoRequest } from "@/api/memos"
import { list as listMemos } from "@/api/memos"
import type { Memo } from "@/domain/Memo"
import { useMemoCreator } from "@/hooks/api/memos"
import { useQuery } from "@/hooks/useQuery"

export interface Filter {
    tag?: string
    query?: string
    exactDate?: Date
    startDate?: Date
}

export function useMemoListStore(init: { filter: Filter }) {
    return useQuery<Memo, { filter: Filter }, Date>(listMemos, init)
}

export interface ListMemosPageState {
    creating: {
        created?: Memo
        inProgress: boolean
        error?: Error
    }
    createMemo: (memo: CreateMemoRequest) => void
}

export function useListMemosPageState(): ListMemosPageState {
    let memoCreator = useMemoCreator()

    return {
        creating: {
            created: memoCreator.created,
            inProgress: memoCreator.isLoading,
            error: memoCreator.error,
        },
        createMemo: memoCreator.create,
    }
}
