import { queueTask } from "@/lib/microtask"
import React, { useEffect, useSyncExternalStore } from "react"

export function useAppHeaderState() {
    return useSyncExternalStore(_subscribe, _getSnapshot)
}

export function useAddToAppHeader(items: {
    left?: React.ReactElement
    centre?: React.ReactElement
    right?: React.ReactElement
}) {
    useEffect(() => {
        _state = {
            left: items.left ? [..._state.left, items.left] : _state.left,
            centre: items.centre ? [..._state.centre, items.centre] : _state.centre,
            right: items.right ? [..._state.right, items.right] : _state.right,
        }
        queueTask(() => {
            _subscribers.forEach((cb) => cb())
        })
        return () => {
            _state = {
                left: _state.left.filter((i) => items.left?.key !== i.key),
                centre: _state.centre.filter((i) => items.centre?.key !== i.key),
                right: _state.right.filter((i) => items.right?.key !== i.key),
            }
            queueTask(() => {
                _subscribers.forEach((cb) => cb())
            })
        }
    }, [items])
}

type AppHeaderState = {
    left: React.ReactElement[]
    centre: React.ReactElement[]
    right: React.ReactElement[]
}

let _state = {
    left: [],
    centre: [],
    right: [],
} as AppHeaderState
let _subscribers = [] as (() => void)[]

function _subscribe(cb: () => void) {
    _subscribers.push(cb)
    return () => {
        _subscribers = _subscribers.filter((i) => cb !== i)
    }
}

function _getSnapshot() {
    return _state
}
