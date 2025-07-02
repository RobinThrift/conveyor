import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

import type { AttachmentID } from "@/domain/Attachment"

export interface TransferAttachmentRequest {
    id: AttachmentID
    filename: string
    content: ArrayBufferLike
}

type TransferAttachmentState = Record<
    AttachmentID,
    | {
          state: "transferring"
      }
    | { state: "done" }
    | { state: "error"; error: Error }
>

const initialState: TransferAttachmentState = {}

export const slice = createSlice({
    name: "transfer",
    initialState,
    reducers: {
        startTransfer: (state, { payload }: PayloadAction<TransferAttachmentRequest>) => {
            state[payload.id] = { state: "transferring" }
        },

        setTransferDone: (state, { payload }: PayloadAction<{ id: AttachmentID }>) => {
            state[payload.id] = { state: "done" }
        },

        setTransferError: (
            state,
            { payload }: PayloadAction<{ id: AttachmentID; error: Error }>,
        ) => {
            state[payload.id] = {
                state: "error",
                error: payload.error,
            }
        },
    },

    selectors: {
        getTransferState: (state, id: AttachmentID) => state[id]?.state,
    },
})
