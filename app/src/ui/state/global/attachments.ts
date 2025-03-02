import { type PayloadAction, createSlice } from "@reduxjs/toolkit"
import { useEffect } from "react"
import { useDispatch } from "react-redux"

import type { Attachment } from "@/domain/Attachment"
// import * as attachmentStorage from "@/storage/attachments"
import * as eventbus from "@/ui/eventbus"
import type { StartListening } from "@/ui/state/rootStore"

export interface AttachmentsState {
    tasks: Record<string, UploadAttachmentTask>
}

interface UploadAttachmentTask {
    id: string
    abortCtrl?: AbortController
    isInProgress: boolean
    attachment?: Attachment
    error?: Error
}

const initialState: AttachmentsState = {
    tasks: {},
}

export const slice = createSlice({
    name: "attachments",
    reducerPath: "global.attachments",
    initialState,
    reducers: {
        uploadAttachment: (
            state,
            {
                payload,
            }: PayloadAction<{
                taskID: string
                filename: string
                data: ReadableStream<Uint8Array>
            }>,
        ) => {
            if (state.tasks[payload.taskID]) {
                return state
            }

            return {
                ...state,
                tasks: {
                    ...state.tasks,
                    [payload.taskID]: {
                        id: payload.taskID,
                        isInProgress: true,
                    },
                },
            }
        },
        setAttachment: (
            state,
            {
                payload,
            }: PayloadAction<{ taskID: string; attachment: Attachment }>,
        ) => {
            let task = state.tasks[payload.taskID]
            if (!task) {
                return state
            }

            return {
                ...state,
                tasks: {
                    ...state.tasks,
                    [task.id]: {
                        ...task,
                        attachment: payload.attachment,
                        isInProgress: false,
                    },
                },
            }
        },
        setError: (
            state,
            { payload }: PayloadAction<{ taskID: string; error: Error }>,
        ) => {
            let task = state.tasks[payload.taskID]
            if (!task) {
                return state
            }

            return {
                ...state,
                tasks: {
                    ...state.tasks,
                    [task.id]: {
                        ...task,
                        error: payload.error,
                        isInProgress: false,
                    },
                },
            }
        },
    },
})

export const registerEffects = (_startListening: StartListening) => {
    // startListening({
    //     actionCreator: slice.actions.uploadAttachment,
    //     effect: async ({ payload }, { dispatch, signal }) => {
    //         let attachment: Attachment
    //         try {
    //             attachment = await attachmentStorage.uploadAttachment({
    //                 filename: payload.filename,
    //                 data: payload.data,
    //                 // @TODO: Add baseURL
    //                 signal,
    //             })
    //         } catch (err) {
    //             dispatch(
    //                 dispatch(
    //                     slice.actions.setError({
    //                         taskID: payload.taskID,
    //                         error: err as Error,
    //                     }),
    //                 ),
    //             )
    //             return
    //         }
    //
    //         dispatch(
    //             slice.actions.setAttachment({
    //                 taskID: payload.taskID,
    //                 attachment,
    //             }),
    //         )
    //     },
    // })
    //
    // startListening({
    //     actionCreator: slice.actions.setError,
    //     effect: async ({ payload }) => {
    //         eventbus.emit("attachments:upload:error", payload)
    //     },
    // })
    //
    // startListening({
    //     actionCreator: slice.actions.setAttachment,
    //     effect: async ({ payload }) => {
    //         eventbus.emit("attachments:upload:done", payload)
    //     },
    // })
}

export function useAttachmentUploader() {
    let dispatch = useDispatch()
    useEffect(() => {
        return eventbus.on("attachments:upload:start", (evt) => {
            dispatch(slice.actions.uploadAttachment(evt))
        })
    }, [dispatch])
}
