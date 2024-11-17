import { isEqual } from "@/helper"
import { useCallback, useEffect, useMemo, useReducer } from "react"

export class NewerRequestError extends Error {}

export interface UseAPIRequest<Params, Data> {
    isLoading: boolean
    data?: Data
    error?: Error
    request: (params: Params) => void
    reload: () => void
}

export type APIFunc<Params, Data> = (
    params: Params & { signal?: AbortSignal },
) => Promise<Data>

export function useAPIRequest<Params, Data>(
    fn: APIFunc<Params, Data>,
): UseAPIRequest<Params, Data> {
    let [state, dispatch] = useReducer(apiRequestReducer<Params, Data>, {
        fn,
        isLoading: true,
    })

    useEffect(() => {
        if (!state.current) {
            return
        }

        state.current
            .then((res) => {
                dispatch({ type: "done", payload: res })
            })
            .catch((err) => {
                if (err instanceof NewerRequestError) {
                    return
                }

                dispatch({ type: "error", payload: err })
            })

        return () => state.abortCtrl?.abort()
    }, [state.current, state.abortCtrl])

    let request = useCallback((params: Params) => {
        dispatch({ type: "start", payload: params })
    }, [])

    let reload = useCallback(() => {
        dispatch({ type: "reload" })
    }, [])

    return useMemo(
        () => ({
            isLoading: state.isLoading,
            data: state.data,
            error: state.error,
            request,
            reload,
        }),
        [state.isLoading, state.data, state.error, request, reload],
    )
}

type UseAPIRequestAction<Params, Data> =
    | { type: "reload"; payload?: never }
    | { type: "start"; payload: Params }
    | {
          type: "done"
          payload: Data
      }
    | {
          type: "error"
          payload: Error
      }

interface UseAPIRequestState<Params, Data> {
    fn: APIFunc<Params, Data>
    isLoading: boolean
    data?: Data
    error?: Error
    params?: Params
    current?: Promise<Data>
    abortCtrl?: AbortController
}

function apiRequestReducer<Params, Data>(
    state: UseAPIRequestState<Params, Data>,
    action: UseAPIRequestAction<Params, Data>,
): UseAPIRequestState<Params, Data> {
    switch (action.type) {
        case "reload": {
            if (state.isLoading) {
                return state
            }

            if (state.abortCtrl) {
                state.abortCtrl.abort(
                    new NewerRequestError("aborted due to newer request"),
                )
            }

            let abortCtrl = new AbortController()

            return {
                ...state,
                isLoading: true,
                current: state.fn({
                    // biome-ignore lint/style/noNonNullAssertion: can neve be null here
                    ...state.params!,
                    signal: abortCtrl.signal,
                }),
                abortCtrl,
                error: undefined,
            }
        }
        case "start": {
            if (isEqual(state.params, action.payload)) {
                return state
            }

            if (state.abortCtrl) {
                state.abortCtrl.abort(
                    new NewerRequestError("aborted due to newer request"),
                )
            }

            let abortCtrl = new AbortController()

            return {
                ...state,
                isLoading: true,
                params: action.payload,
                current: state.fn({
                    ...action.payload,
                    signal: abortCtrl.signal,
                }),
                abortCtrl,
                error: undefined,
            }
        }
        case "done":
            return {
                ...state,
                isLoading: false,
                data: action.payload,
                abortCtrl: undefined,
                error: undefined,
            }

        case "error":
            return {
                ...state,
                isLoading: false,
                current: undefined,
                abortCtrl: undefined,
                error: action.payload,
            }
    }

    // @ts-expect-error: provide fallback for rogue action types
    return state
}
