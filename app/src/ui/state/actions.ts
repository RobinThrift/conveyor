import { actions as attachments } from "./attachments"
import { actions as auth } from "./auth"
import { slice as notifications } from "./global/notifications"
import { slice as router } from "./global/router"
import { actions as memos } from "./memos"
import { actions as settings } from "./settings"
import { actions as setup } from "./setup"
import { actions as sync } from "./sync"
import { actions as tags } from "./tags"
import { actions as unlock } from "./unlock"

export type { UpdateMemoRequest, Filter, CreateMemoRequest } from "./memos"

export const actions = {
    attachments,
    auth,
    memos,
    settings,
    setup,
    sync,
    tags,
    unlock,
    router: router.actions,

    global: {
        notifications: {
            add: notifications.actions.add,
        },
    },
}
