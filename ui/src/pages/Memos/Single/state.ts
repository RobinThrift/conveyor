import { type RootState, actions } from "@/state"
import type { UpdateMemoRequest } from "@/state/memos"
import { useCallback, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"

export function useSingleMemoPageState(id: string) {
    let selector = useMemo(
        () => (state: RootState) => state.memos.memos[id],
        [id],
    )
    let state = useSelector(selector)
    let dispatch = useDispatch()
    let load = useCallback(
        () => dispatch(actions.memos.load({ id })),
        [dispatch, id],
    )
    let update = useCallback(
        (memo: UpdateMemoRequest) => dispatch(actions.memos.update({ memo })),
        [dispatch],
    )

    return useMemo(
        () => ({
            state,
            actions: {
                load,
                update,
            },
        }),
        [state, load, update],
    )
}
