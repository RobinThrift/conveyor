import { combineSlices } from "@reduxjs/toolkit"

import { BaseContext } from "@/lib/context"
import type { AttachmentStorage } from "@/storage/attachments"
import type { RootState, StartListening } from "@/ui/state/rootStore"

import * as transfer from "./transfer"

export const slice = {
    reducerPath: "attachments",
    reducer: combineSlices(transfer.slice),
}

export const selectors = {
    ...transfer.slice.getSelectors(
        (state: RootState) => state.attachments.transfer,
    ),
}

export const actions = {
    ...transfer.slice.actions,
}

export const registerStorageEffects = ({
    startListening,
    attachmentStorage,
}: {
    attachmentStorage: AttachmentStorage
    startListening: StartListening
}) => {
    startListening({
        actionCreator: transfer.slice.actions.startTransfer,
        effect: async (
            { payload },
            { cancelActiveListeners, dispatch, signal },
        ) => {
            cancelActiveListeners()

            let ctx = BaseContext.withData("db", undefined).withSignal(signal)

            let created = await attachmentStorage.createAttachment(ctx, {
                id: payload.id,
                filename: payload.filename,
                content: payload.content,
            })
            if (!created.ok) {
                dispatch(
                    transfer.slice.actions.setTransferError({
                        id: payload.id,
                        error: created.err,
                    }),
                )
                return
            }

            dispatch(
                transfer.slice.actions.setTransferDone({
                    id: created.value,
                }),
            )
        },
    })
}
