import { actions as attachments } from "./attachments"
// import { slice as storage } from "./global/storage"
import { slice as notifications } from "./global/notifications"
import { actions as memos } from "./memos"
import { actions as tags } from "./tags"

export type { UpdateMemoRequest, Filter, CreateMemoRequest } from "./memos"

export const actions = {
    memos,
    tags,
    attachments,

    global: {
        // storage: {
        //     init: storage.actions.init,
        // },
        notifications: {
            add: notifications.actions.add,
        },
    },
}
