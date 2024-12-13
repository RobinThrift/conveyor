import { slice as apiTokens } from "./apitokens"
import { slice as memoList } from "./memolist"
import { slice as memos } from "./memos"
import { slice as notifications } from "./notifications"
import { slice as router } from "./router"
import { slice as settings } from "./settings"
import { slice as tags } from "./tags"

export const actions = {
    router: {
        init: router.actions.init,
    },
    settings: {
        init: settings.actions.init,
    },
    memos: {
        load: memos.actions.load,
        update: memos.actions.update,
    },
    memoList: {
        loadPage: memoList.actions.loadPage,
        nextPage: memoList.actions.nextPage,
        setFilter: memoList.actions.setFilter,
        create: memoList.actions.create,
        update: memoList.actions.update,
    },
    tags: {
        loadPage: tags.actions.loadPage,
        nextPage: tags.actions.nextPage,
    },
    apiTokens: {
        loadPage: apiTokens.actions.loadPage,
        nextPage: apiTokens.actions.nextPage,
        prevPage: apiTokens.actions.prevPage,
        create: apiTokens.actions.create,
        del: apiTokens.actions.del,
    },
    notifications: {
        add: notifications.actions.add,
    },
}
