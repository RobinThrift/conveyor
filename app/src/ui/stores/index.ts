import type { BackendClient } from "@/backend/BackendClient"
import type { NavigationController } from "@/control/NavigationController"

import * as apitokens from "./apitokens"
import * as attachments from "./attachments"
import * as auth from "./auth"
import * as backendStore from "./backend"
import * as create from "./create"
import * as jobs from "./jobs"
import * as memos from "./memos"
import * as navigation from "./navigation"
import * as settings from "./settings"
import * as setup from "./setup"
import * as single from "./single"
import * as sync from "./sync"
import * as tags from "./tags"
import * as unlock from "./unlock"

export type { CreateMemoRequest } from "./create"

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
        list: {
            memos: memos.memos,
            nextPage: memos.nextPage,
            filter: memos.filter,
            state: memos.status,
            error: memos.error,
            isOutdated: memos.isOutdated,
        },
        single: {
            memo: single.single,
            id: single.singleID,
            status: single.status,
            error: single.error,
        },
        create: {
            status: create.status,
            error: create.error,
        },
    },
    navigation: {
        currentPage: navigation.currentPage,
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
        list: memos.actions,
        single: single.actions,
        create: create.actions,
    },
    navigation: navigation.actions,
    settings: settings.actions,
    setup: setup.actions,
    sync: sync.actions,
    tags: tags.actions,
    unlock: unlock.actions,
}

export const selectors = {
    apitokens: apitokens.selectors,
    attachments: attachments.selectors,
    jobs: jobs.selectors,
    memos: {
        list: memos.selectors,
        single: single.selectors,
        create: create.selectors,
    },
    navigation: navigation.selectors,
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
    create.registerEffects(backend)
    jobs.registerEffects(backend)
    memos.registerEffects(backend)
    navigation.registerEffects(navCtrl)
    settings.registerEffects(backend)
    setup.registerEffects(backend)
    single.registerEffects(backend)
    sync.registerEffects(backend)
    tags.registerEffects(backend)
    unlock.registerEffects({ backend, navCtrl })
    backendStore.registerEffects({ backend, navCtrl })
}
