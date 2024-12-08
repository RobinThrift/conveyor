import { useMutator } from "@/hooks/useMutator"
import { useQuery } from "@/hooks/useQuery"

import { get as getMemo, update as updateMemo } from "@/api/memos"
import { useNotificationDispatcher } from "@/notifications"
import { useEffect, useMemo } from "react"

export function useSingleMemoPageState(id: string) {
    let addNotification = useNotificationDispatcher()
    let memo = useQuery(getMemo, { id }, { fetchOnMount: true })
    let updater = useMutator(updateMemo)

    useEffect(() => {
        if (memo.error) {
            let [title, message] = memo.error.message.split(/:\n/, 2)
            addNotification({
                type: "error",
                title,
                message,
            })
        }
    }, [memo.error, addNotification])

    useEffect(() => {
        if (updater.error) {
            let [title, message] = updater.error.message.split(/:\n/, 2)
            addNotification({
                type: "error",
                title,
                message,
            })
        }
    }, [updater.error, addNotification])

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
