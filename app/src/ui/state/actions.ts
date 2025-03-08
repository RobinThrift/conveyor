import { actions as attachments } from "./attachments"
import { slice as notifications } from "./global/notifications"
import { actions as memos } from "./memos"
import { actions as settings } from "./settings"
import { actions as tags } from "./tags"

export type { UpdateMemoRequest, Filter, CreateMemoRequest } from "./memos"

export const actions = {
    memos,
    tags,
    attachments,
    settings,

    global: {
        notifications: {
            add: notifications.actions.add,
        },
    },
}
