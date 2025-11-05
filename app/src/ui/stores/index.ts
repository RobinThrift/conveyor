import type { BackendClient } from "@/backend/BackendClient"
import type { NavigationController } from "@/control/NavigationController"

import * as apitokens from "./apitokens"
import * as attachments from "./attachments"
import * as auth from "./auth"
import * as backendStore from "./backend"
import * as jobs from "./jobs"
import * as memoList from "./memoList"
import * as memos from "./memos"
import * as navigation from "./navigation"
import * as settings from "./settings"
import * as setup from "./setup"
import * as sync from "./sync"
import * as tags from "./tags"
import * as ui from "./ui"
import * as unlock from "./unlock"

export const stores = {
    apitokens: {
        tokens: apitokens.list,
        status: apitokens.status,
        pagination: apitokens.pagination,
        error: apitokens.error,
        lastCreated: apitokens.lastCreated,
    },
    attachments: {
        states: attachments.states,
        attachments: attachments.attachments,
    },
    auth: {
        status: auth.status,
        error: auth.error,
    },
    backend: {
        isReady: backendStore.isReady,
        error: backendStore.error,
    },
    jobs: {
        currentJob: jobs.currentJob,
    },
    memos: {
        memos: memos.refs,
        list: {
            items: memoList.listItems,
            nextPage: memoList.nextPage,
            filter: memoList.filter,
            state: memoList.status,
            error: memoList.error,
            isOutdated: memoList.isOutdated,
        },
    },
    navigation: {
        currentScreen: navigation.currentScreen,
    },
    settings: {
        values: settings.values,
        state: settings.state,
    },
    setup: {
        isSetup: setup.isSetup,
        step: setup.step,
        selectedOptions: setup.selectedOptions,
        error: setup.error,
    },
    sync: {
        status: sync.status,
        info: sync.info,
        error: sync.error,
    },
    tags: {
        tags: tags.list,
        state: tags.state,
        error: tags.error,
    },
    ui: {
        openMemos: ui.openMemos,
        activeMemos: ui.activeMemos,
        memoTabScrollOffsets: ui.memoTabScrollOffsets,
    },
    unlock: {
        status: unlock.status,
        error: unlock.error,
    },
}

export const actions = {
    apitokens: apitokens.actions,
    attachments: attachments.actions,
    auth: auth.actions,
    jobs: jobs.actions,
    memos: {
        new: memos.actions.newMemo,
        startEdit: memos.actions.startEdit,
        cancelEdit: memos.actions.cancelEdit,
        updateContent: memos.actions.updateContent,
        delete: memos.actions.delete,
        undelete: memos.actions.undelete,
        setArchiveStatus: memos.actions.setArchiveStatus,
        list: {
            ...memoList.actions,
        },
    },
    navigation: navigation.actions,
    settings: settings.actions,
    setup: setup.actions,
    sync: sync.actions,
    tags: tags.actions,
    ui: ui.actions,
    unlock: unlock.actions,
}

export const selectors = {
    apitokens: apitokens.selectors,
    attachments: attachments.selectors,
    jobs: jobs.selectors,
    memos: {
        get: memos.selectors.get,
        isEditing: memos.selectors.isEditing,
        isNew: memos.selectors.ieNew,
        list: memoList.selectors,
    },
    settings: settings.selectors,
    setup: setup.selectors,
    sync: sync.selectors,
    unlock: unlock.selectors,
}

export function registerEffects({
    backend,
    navCtrl,
}: {
    backend: BackendClient
    navCtrl: NavigationController
}) {
    apitokens.registerEffects(backend)
    attachments.registerEffects(backend)
    auth.registerEffects(backend)
    jobs.registerEffects(backend)
    memos.registerEffects(backend)
    memoList.registerEffects(backend)
    navigation.registerEffects(navCtrl)
    settings.registerEffects(backend)
    setup.registerEffects(backend)
    sync.registerEffects(backend)
    tags.registerEffects(backend)
    ui.registerEffects(navCtrl)
    unlock.registerEffects({ backend, navCtrl })
    backendStore.registerEffects({ backend, navCtrl })
}
