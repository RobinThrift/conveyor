import type { AttachmentController } from "@/control/AttachmentController"
import { BaseContext } from "@/lib/context"
import type { StartListening } from "@/ui/state/rootStore"

import * as transfer from "./transfer"

export const registerEffects = (
    startListening: StartListening,
    {
        attachmentCtrl,
    }: {
        attachmentCtrl: AttachmentController
    },
) => {
    startListening({
        actionCreator: transfer.slice.actions.startTransfer,
        effect: async (
            { payload },
            { cancelActiveListeners, dispatch, signal },
        ) => {
            cancelActiveListeners()

            let ctx = BaseContext.withData("db", undefined).withSignal(signal)

            let created = await attachmentCtrl.createAttachment(ctx, {
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
