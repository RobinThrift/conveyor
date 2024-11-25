import { useMutator } from "@/hooks/useMutator"
import { useQuery } from "@/hooks/useQuery"

import { get as getMemo, update as updateMemo } from "@/api/memos"
import { useMemo } from "react"

export function useSingleMemoPageState(id: string) {
    let memo = useQuery(getMemo, { id }, { fetchOnMount: true })
    let updater = useMutator(updateMemo)

    return useMemo(
        () => ({
            memo: memo.value,
            isLoading: memo.isLoading || updater.inProgress,
            error: memo.error ?? updater.error,
            updateMemo: updater.exec,
        }),
        [
            memo.value,
            memo.isLoading,
            memo.error,
            updater.inProgress,
            updater.error,
            updater.exec,
        ],
    )
}
