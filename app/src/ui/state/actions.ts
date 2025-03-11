import { actions as attachments } from "./attachments"
import { actions as auth } from "./auth"
import { slice as notifications } from "./global/notifications"
import { actions as memos } from "./memos"
import { actions as settings } from "./settings"
import { actions as sync } from "./sync"
import { actions as tags } from "./tags"

export type { UpdateMemoRequest, Filter, CreateMemoRequest } from "./memos"

export const actions = {
    memos,
    tags,
    attachments,
    settings,
    sync,
    auth,

    global: {
        notifications: {
            add: notifications.actions.add,
        },
    },
}
