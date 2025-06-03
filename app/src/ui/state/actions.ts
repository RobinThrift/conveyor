import { actions as apitokens } from "./apitokens"
import { actions as attachments } from "./attachments"
import { actions as auth } from "./auth"
import { slice as notifications } from "./global/notifications"
import { actions as jobs } from "./jobs"
import { actions as memos } from "./memos"
import { actions as navigation } from "./navigation"
import { actions as settings } from "./settings"
import { actions as setup } from "./setup"
import { actions as sync } from "./sync"
import { actions as tags } from "./tags"
import { actions as unlock } from "./unlock"

export type { UpdateMemoRequest, Filter, CreateMemoRequest } from "./memos"

export type { CreateAPITokenRequest } from "./apitokens"

export const actions = {
    apitokens,
    attachments,
    auth,
    jobs,
    navigation,
    memos,
    settings,
    setup,
    sync,
    tags,
    unlock,

    global: {
        notifications: {
            add: notifications.actions.add,
        },
    },
}
