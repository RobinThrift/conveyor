import { useEffect, useRef, useState } from "react"

export interface UseStateSetter<S> {
    add(s: Iterable<S>): void
    toggle(s: S): void
    delete(s: S): void
}

export function useStateSet<S>(
    init: Iterable<S> | (() => Iterable<S>),
): [S[], UseStateSetter<S>] {
    let [values, setValues] = useState<S[]>([])
    let state = useRef<Set<S>>(new Set())
    let setter = useRef<UseStateSetter<S>>({
        add: (s: Iterable<S>) => {
            Iterator.from(s).forEach((v) => {
                state.current.add(v)
            })
            setValues([...state.current.values()])
        },
        toggle: (s: S) => {
            if (state.current.has(s)) {
                state.current.delete(s)
            } else {
                state.current.add(s)
            }
            setValues([...state.current.values()])
        },
        delete: (s: S) => {
            state.current.delete(s)
            setValues([...state.current.values()])
        },
    })

    // biome-ignore lint/correctness/useExhaustiveDependencies: This is intentional as it should only run once
    useEffect(() => {
        let v: Iterable<S>
        if (typeof init === "function") {
            v = init()
        } else {
            v = init
        }
        state.current = new Set(v)
        setValues([...state.current.values()])
    }, [])

    return [values, setter.current]
}
