import { useMemo, useReducer, useRef } from "react"

export function useStateGetter<S>(initial: S): [() => S, (newState: S) => void] {
    let state = useRef<S>(initial)
    let triggerUpdate = useUpdateTrigger()

    return useMemo(
        () => [
            () => state.current as S,
            (newState: S) => {
                state.current = newState
                triggerUpdate()
            },
        ],
        [triggerUpdate],
    )
}

const updateUpdateTriggerReducer = (num: number): number => (num + 1) % 1_000_000

function useUpdateTrigger(): () => void {
    let [, triggerUpdate] = useReducer(updateUpdateTriggerReducer, 0)
    return triggerUpdate
}
