import { slice as apiTokens } from "./entities/apitokens"
import { slice as memos } from "./entities/memos"
import { slice as tags } from "./entities/tags"
import { slice as notifications } from "./global/notifications"

import { slice as pageMemoEdit } from "./pages/Memos/Edit/state"
import { slice as pageMemoList } from "./pages/Memos/List/state"
import { slice as pageMemoNew } from "./pages/Memos/New/state"
import { slice as pageMemoSingle } from "./pages/Memos/Single/state"

export type { UpdateMemoRequest } from "./entities/memos"

export const actions = {
    global: {
        notifications: {
            add: notifications.actions.add,
        },
    },
    entities: {
        Tags: {
            load: tags.actions.loadTags,
        },
        Memos: {
            update: memos.actions.update,
        },
        apiTokens: {
            loadPage: apiTokens.actions.loadPage,
            nextPage: apiTokens.actions.nextPage,
            prevPage: apiTokens.actions.prevPage,
            create: apiTokens.actions.create,
            del: apiTokens.actions.del,
        },
    },
    pages: {
        Memos: {
            List: {
                loadPage: pageMemoList.actions.loadPage,
                nextPage: pageMemoList.actions.nextPage,
                setFilter: pageMemoList.actions.setFilter,
                create: pageMemoList.actions.create,
            },
            Single: {
                setMemoID: pageMemoSingle.actions.setMemoID,
            },
            Edit: {
                setMemoID: pageMemoEdit.actions.setMemoID,
            },
            New: {
                createMemo: pageMemoNew.actions.create,
            },
        },
    },
}
