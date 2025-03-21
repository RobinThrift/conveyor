import React from "react"
import ReactDOM from "react-dom/client"

import { AttachmentController } from "@/control/AttachmentController"
import { ChangelogController } from "@/control/ChangelogController"
import { MemoController } from "@/control/MemoController"
import { SettingsController } from "@/control/SettingsController"
import { WebCryptoSha256Hasher } from "@/external/browser/crypto"
import { history } from "@/external/browser/history"
import { SQLite } from "@/external/browser/sqlite"
import { AttachmentRepo } from "@/storage/database/sqlite/AttachmentRepo"
import { ChangelogRepo } from "@/storage/database/sqlite/ChangelogRepo"
import { MemoRepo } from "@/storage/database/sqlite/MemoRepo"
import { SettingsRepo } from "@/storage/database/sqlite/SettingsRepo"
import { App } from "@/ui/App"
import { serverData } from "@/ui/App/ServerData"
import {
    AttachmentProvider,
    attachmentContextFromController,
} from "@/ui/attachments"
import * as eventbus from "@/ui/eventbus"
import { SettingsLoader } from "@/ui/settings"
import {
    Provider,
    actions,
    configureEffects,
    configureRootStore,
} from "@/ui/state"

import { AuthV1APIClient } from "@/api/authv1"
import { APITokensV1APIClient } from "@/api/authv1/APITokensV1APIClient"
import { SyncV1APIClient } from "@/api/syncv1"
import { EncryptedRemoteAttachmentFetcher } from "@/api/syncv1/EncryptedRemoteAttachmentFetcher"
import { APITokenController } from "@/control/APITokenController"
import { AuthController } from "@/control/AuthController"
import { SetupController } from "@/control/SetupController"
import { SyncController } from "@/control/SyncController"
import { UnlockController } from "@/control/UnlockController"
import { AgeCrypto } from "@/external/age/AgeCrypto"
import { OPFS } from "@/external/browser/opfs"
import { BaseContext } from "@/lib/context"
import { EncryptedFS } from "@/lib/fs/EncryptedFS"
import { IndexedDBAuthStorage } from "@/storage/indexeddb/IndexedDBAuthStorage"
import { IndexedDBSyncStorage } from "@/storage/indexeddb/IndexedDBSyncStorage"
import { LocalStorageSetupInfoStorage } from "@/storage/localstorage/LocalStorageSetupInfoStorage"
import { SessionStorageUnlockStorage } from "@/storage/sessionstorage/SessionStorageUnlockStorage"

import "@/ui/styles/index.css"
import { toPromise } from "./lib/result"

const _ready = Promise.withResolvers<void>()

main()

async function main() {
    let ctx = BaseContext

    let rootStore = configureRootStore({
        baseURL:
            globalThis.document
                ?.querySelector("meta[name=base-url]")
                ?.getAttribute("content")
                ?.replace(/\/$/, "") ?? "",
        router: { href: history.current },
    })

    eventbus.on("notifications:add", (notification) => {
        rootStore.dispatch(actions.global.notifications.add({ notification }))
    })

    let controller = await initController()

    window.addEventListener("unload", async () => {
        await controller.db.close()
    })

    configureEffects(controller)

    let autoUnlock = await toPromise(
        controller.unlockCtrl.tryGetPlaintextPrivateKey(ctx),
    )
    if (autoUnlock) {
        rootStore.dispatch(
            actions.unlock.unlock({
                plaintextKeyData: autoUnlock,
            }),
        )
    } else {
        rootStore.dispatch(actions.setup.loadSetupInfo())
        rootStore.dispatch(actions.sync.loadSyncInfo())
    }

    let unsub = rootStore.subscribe(() => {
        let state = rootStore.getState()

        if (state.unlock.isUnlocked) {
            unsub()
            _ready.resolve()
            return
        }

        if (state.setup.isSetup) {
            unsub()
            rootStore.dispatch(actions.router.goto({ path: "/unlock" }))
            _ready.resolve()
            return
        }

        if (state.setup.step === "initial-setup") {
            unsub()
            rootStore.dispatch(actions.router.goto({ path: "/setup" }))
            _ready.resolve()
        }
    })

    await _ready.promise

    // biome-ignore lint/style/noNonNullAssertion: if this is null all is lost anyway
    ReactDOM.createRoot(document.getElementById("__BELT_UI_ROOT__")!).render(
        <React.StrictMode>
            <Provider store={rootStore}>
                <AttachmentProvider
                    value={attachmentContextFromController(
                        controller.attachmentCtrl,
                    )}
                >
                    <SettingsLoader>
                        <App {...serverData} />
                    </SettingsLoader>
                </AttachmentProvider>
            </Provider>
        </React.StrictMode>,
    )
}

async function initController() {
    let db = new SQLite({
        onError: (err) => {
            console.error(err)
        },
    })

    let crypto = new AgeCrypto()

    let rawFS = new OPFS("belt", {
        onError: (err) => {
            console.error(err)
        },
    })

    let encryptedFS = new EncryptedFS(rawFS, crypto)

    let authStorage = new IndexedDBAuthStorage(crypto)

    let authCtrl = new AuthController({
        origin: globalThis.location.host,
        storage: authStorage,
        authPIClient: new AuthV1APIClient({
            baseURL: globalThis.location.href,
        }),
    })

    let syncAPIClient = new SyncV1APIClient({
        baseURL: globalThis.location.href,
        tokenStorage: authCtrl,
    })

    let changelogCtrl = new ChangelogController({
        sourceName: "web",
        transactioner: db,
        repo: new ChangelogRepo(db),
    })

    let settingsCtrl = new SettingsController({
        transactioner: db,
        repo: new SettingsRepo(db),
        changelog: changelogCtrl,
    })

    let attachmentCtrl = new AttachmentController({
        transactioner: db,
        repo: new AttachmentRepo(db),
        fs: encryptedFS,
        hasher: new WebCryptoSha256Hasher(),
        remote: new EncryptedRemoteAttachmentFetcher({
            syncAPIClient,
            decrypter: crypto,
        }),
        changelog: changelogCtrl,
    })

    let memoCtrl = new MemoController({
        transactioner: db,
        repo: new MemoRepo(db),
        attachments: attachmentCtrl,
        changelog: changelogCtrl,
    })

    let syncStorage = new IndexedDBSyncStorage(crypto)

    let syncCtrl = new SyncController({
        storage: syncStorage,
        dbPath: "belt.db",
        transactioner: db,
        syncAPIClient,
        memos: memoCtrl,
        attachments: attachmentCtrl,
        settings: settingsCtrl,
        changelog: changelogCtrl,
        fs: rawFS,
        crypto,
    })

    let setupCtrl = new SetupController({
        storage: new LocalStorageSetupInfoStorage(),
    })

    let unlockCtrl = new UnlockController({
        storage: new SessionStorageUnlockStorage(),
        db,
        crypto,
    })

    let apiTokenCtrl = new APITokenController({
        apiTokenAPIClient: new APITokensV1APIClient({
            baseURL: globalThis.location.href,
            tokenStorage: authCtrl,
        }),
    })

    await Promise.all([
        authStorage.open(BaseContext),
        syncStorage.open(BaseContext),
    ])

    return {
        db,
        attachmentCtrl,
        authCtrl,
        memoCtrl,
        settingsCtrl,
        setupCtrl,
        syncCtrl,
        unlockCtrl,
        apiTokenCtrl,
    }
}
