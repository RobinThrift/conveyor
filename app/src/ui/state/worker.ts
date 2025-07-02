import { produce } from "immer"
import { type Delta, diff, patch } from "jsondiffpatch"
import {
    type Action,
    type Reducer,
    type Store,
    type StoreEnhancer,
    type StoreEnhancerStoreCreator,
    type UnknownAction,
    compose,
    createStore,
} from "redux"

import { newID } from "@/domain/ID"

import { CalendarDate } from "@internationalized/date"
import { type RootState, startListening } from "./rootStore"

const REPLACE_STATE_ACTION_TYPE = "@internal/REPLACE_STATE"

interface ReplaceStateAction<S> extends Action<typeof REPLACE_STATE_ACTION_TYPE> {
    state: S
}

export async function connectoToWorkerStore<S, A extends Action = UnknownAction>(
    worker: Worker,
    additionalEnhancers?: StoreEnhancer[],
): Promise<Store<S, A>> {
    let reducer: Reducer<S, A & ReplaceStateAction<S>> = (state, action) => {
        if (action.type === REPLACE_STATE_ACTION_TYPE) {
            return action.state
        }
        return state as S
    }

    let enhancer = await forwardToWorkerEnhancer(worker)
    if (additionalEnhancers) {
        enhancer = compose(enhancer, ...additionalEnhancers)
    }

    return createStore(reducer, {} as S, enhancer)
}

type WorkerRequests<A> = { id: string; type: "store:dispatch:request"; data: A }

type WorkerNotification<S, A> =
    | { type: "store:notification:ready"; data: S; trace?: string }
    | {
          id: string
          type: "store:notification:dispatch"
          data: {
              action: A
              state: Delta
          }
          trace?: string
      }

async function forwardToWorkerEnhancer<S = any, A extends Action = UnknownAction>(
    worker: Worker,
): Promise<StoreEnhancer> {
    let ready = Promise.withResolvers<S>()
    let stateCache: S

    worker.addEventListener(
        "message",
        (evt: MessageEvent<WorkerNotification<S, A>>) => {
            let msg = evt.data
            if (msg.type === "store:notification:ready") {
                evt.stopImmediatePropagation()
                ready.resolve(msg.data)
                return
            }
        },
        { once: true },
    )

    worker.addEventListener("messageerror", (evt: MessageEvent) => {
        console.error("store worker proxy messageerror", evt)
    })

    worker.addEventListener("error", (evt) => {
        console.error("store worker proxy error", evt)
    })

    let postMsg = <M extends Omit<WorkerRequests<A>, "id">>(msg: M) => {
        let id = newID()
        worker.postMessage({
            ...msg,
            id,
        })
    }

    stateCache = fixState(await ready.promise)

    return <NextExt extends object, NextStateExt extends object>(
        createStore: StoreEnhancerStoreCreator<NextExt, NextStateExt>,
    ) =>
        (reducer, initialState?) => {
            let baseStore = createStore(
                (() => {
                    return stateCache as S
                }) as any as typeof reducer,
                initialState,
            )

            worker.addEventListener("message", (evt: MessageEvent<WorkerNotification<S, A>>) => {
                let msg = evt.data
                if (msg.type === "store:notification:dispatch") {
                    performance.mark(`store:dispatch(${msg.data.action.type}):end`)
                    stateCache = produce(stateCache, (draft) =>
                        fixState(patch(draft, msg.data.state)),
                    )
                    baseStore.dispatch({
                        ...msg.data.action,
                        trace: msg.trace,
                    } as any)
                    evt.stopImmediatePropagation()
                    return
                }
            })

            return {
                ...baseStore,

                getState() {
                    return stateCache as S
                },

                dispatch: (action: A) => {
                    let id = newID()
                    performance.mark(`store:dispatch(${action.type}):start`)
                    postMsg({
                        id,
                        type: "store:dispatch:request",
                        data: action,
                    } satisfies WorkerRequests<A>)

                    return action
                },
            }
        }
}

export function runStoreInWorker<S = any, A extends Action = UnknownAction>(store: Store<S, A>) {
    self.addEventListener("message", (evt: MessageEvent<WorkerRequests<A>>) => {
        let msg = evt.data
        if (msg.type === "store:dispatch:request") {
            evt.stopImmediatePropagation()
            store.dispatch(fixAction(evt.data.data))
        }
    })

    startListening({
        predicate() {
            return true
        },
        effect: (action: Action, { getState, getOriginalState }) => {
            let trace: { stack: typeof Error.prototype.stack } = { stack: "" }
            Error.captureStackTrace(trace)

            let state = getState()
            let prevState = getOriginalState()

            postMessage({
                id: newID(),
                type: "store:notification:dispatch",
                data: {
                    action,
                    state: diff(prevState, state),
                },
                trace: trace.stack,
            } as WorkerNotification<S, A>)
        },
    })

    postMessage({
        id: newID(),
        type: "store:notification:ready",
        data: store.getState(),
    } as WorkerNotification<S, A>)
}

function fixState(s: any): any {
    if (!s) {
        return
    }

    let state = s as RootState

    if (state.memos.list.filter.exactDate) {
        state.memos.list.filter.exactDate = new CalendarDate(
            state.memos.list.filter.exactDate.year,
            state.memos.list.filter.exactDate.month,
            state.memos.list.filter.exactDate.day,
        )
    }

    return state
}

function fixAction(a: Action & { payload?: any }): any {
    if (a.type === "list/setFilter" && a.payload?.filter.exactDate) {
        return {
            ...a,
            payload: {
                ...a.payload,
                filter: {
                    ...a.payload.filter,
                    exactDate: new CalendarDate(
                        a.payload.filter.exactDate.year,
                        a.payload.filter.exactDate.month,
                        a.payload.filter.exactDate.day,
                    ),
                },
            },
        }
    }

    if (
        (a.type === "navigation/init" || a.type === "navigation/setPage") &&
        a.payload?.params?.filter?.exactDate
    ) {
        return {
            ...a,
            payload: {
                ...a.payload,
                params: {
                    ...a.payload.parms,
                    filter: {
                        ...a.payload.params.filter,
                        exactDate: new CalendarDate(
                            a.payload.params.filter.exactDate.year,
                            a.payload.params.filter.exactDate.month,
                            a.payload.params.filter.exactDate.day,
                        ),
                    },
                },
            },
        }
    }

    return a
}
