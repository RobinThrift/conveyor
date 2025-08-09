import type { BackendClient } from "@/backend/BackendClient"
import type { AttachmentID } from "@/domain/Attachment"
import { batch, createActions, createEffect, createStore } from "@/lib/store"

type AttachmentState =
    | {
          state: "load-requested"
      }
    | {
          state: "loading"
      }
    | {
          state: "transfer-requested"
      }
    | {
          state: "transferring"
      }
    | { state: "done" }
    | { state: "error"; error: Error }

export const states = createStore<Record<AttachmentID, AttachmentState>>("attachments/states", {})
export const attachments = createStore<
    Record<AttachmentID, { filename: string; data: Uint8Array }>
>("attachments/attachments", {})

export const actions = createActions({
    loadAttachment: (id: AttachmentID) => {
        let cached = attachments.state[id]
        if (cached) {
            return cached
        }

        states.setState((prev) => ({
            ...prev,
            [id]: { state: "load-requested" },
        }))
    },

    transferAttachment: (attachment: { id: AttachmentID; filename: string; data: Uint8Array }) => {
        batch(() => {
            attachments.setState((prev) => ({
                ...prev,
                [attachment.id]: {
                    filename: attachment.filename,
                    data: attachment.data,
                },
            }))
            states.setState((prev) => ({
                ...prev,
                [attachment.id]: { state: "transfer-requested" },
            }))
        })
    },
})

export const selectors = {
    isAttachmentLoading: (id?: AttachmentID) => (state: typeof states.state) => {
        if (!id) {
            return false
        }

        return state[id]?.state === "loading" || state[id]?.state === "load-requested"
    },
    getAttachmentState: (id?: AttachmentID) => (state: typeof states.state) =>
        id ? state[id] : undefined,
    getAttachmentData: (id?: AttachmentID) => (state: typeof attachments.state) =>
        id ? state[id] : undefined,
}

export function registerEffects(backend: BackendClient) {
    createEffect("attachments/transferAttachment", {
        fn: async (ctx, { batch }) => {
            let transfers: Promise<any>[] = []
            for (let id in states.state) {
                let { state } = states.state[id]
                let { data, filename } = attachments.state[id] ?? {}
                if (state !== "transfer-requested") {
                    continue
                }

                transfers.push(
                    (async () => {
                        let [created, err] = await backend.attachments.createAttachment(ctx, {
                            id,
                            filename,
                            content: data.buffer,
                        })
                        if (err) {
                            states.setState((prev) => ({
                                ...prev,
                                [id]: { state: "error", error: err },
                            }))
                            attachments.setState((prev) => {
                                let { [id]: _, ...next } = prev
                                return next
                            })
                            return
                        }

                        batch(() => {
                            attachments.setState((prev) => ({
                                ...prev,
                                [created.id]: {
                                    filename,
                                    data: new Uint8Array(created.data),
                                },
                            }))

                            states.setState((prev) => ({
                                ...prev,
                                [created.id]: { state: "done" },
                            }))
                        })
                    })(),
                )
            }

            await Promise.all(transfers)
        },
        autoMount: true,
        precondition: () =>
            Object.values(states.state).some(({ state }) => state === "transfer-requested"),
        deps: [states],
    })

    createEffect("attachments/loadAttachment", {
        fn: async (ctx, { batch }) => {
            let attachmentID: AttachmentID | undefined
            for (let id in states.state) {
                let { state } = states.state[id]
                if (state === "load-requested") {
                    attachmentID = id
                    states.setState((prev) => ({
                        ...prev,
                        [id]: { state: "loading" },
                    }))
                    break
                }
            }

            if (!attachmentID) {
                return
            }

            let [attachment, err] = await backend.attachments.getAttachmentDataByID(
                ctx,
                attachmentID,
            )
            if (err) {
                states.setState((prev) => ({
                    ...prev,
                    [attachmentID]: { state: "error", error: err },
                }))
                return
            }

            batch(() => {
                states.setState((prev) => ({
                    ...prev,
                    [attachmentID]: { state: "done" },
                }))
                attachments.setState((prev) => ({
                    ...prev,
                    [attachmentID]: {
                        filename: attachment.attachment.filepath,
                        data: new Uint8Array(attachment.data),
                    },
                }))
            })
        },
        autoMount: true,
        deps: [states],
    })
}

if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
        if (!newModule) {
            return
        }

        newModule.states.setState(states.state)
        newModule.attachments.setState(attachments.state)
    })
}
