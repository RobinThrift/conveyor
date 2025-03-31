import { AuthV1APIClient } from "@/api/authv1"
import { APITokensV1APIClient } from "@/api/authv1/APITokensV1APIClient"
import { AccountKeysV1APIClient } from "@/api/authv1/AccountKeysV1APIClient"
import { SyncV1APIClient } from "@/api/syncv1"
import { EncryptedRemoteAttachmentFetcher } from "@/api/syncv1/EncryptedRemoteAttachmentFetcher"
import { type AuthToken, authTokenFromJSON } from "@/auth"
import { APITokenController } from "@/control/APITokenController"
import { AttachmentController } from "@/control/AttachmentController"
import { AuthController } from "@/control/AuthController"
import { ChangelogController } from "@/control/ChangelogController"
import { CryptoController } from "@/control/CryptoController"
import { MemoController } from "@/control/MemoController"
import { SettingsController } from "@/control/SettingsController"
import { SetupController } from "@/control/SetupController"
import { SyncController } from "@/control/SyncController"
import { UnlockController } from "@/control/UnlockController"
import type { SyncInfo } from "@/domain/SyncInfo"
import { AgeCrypto } from "@/external/age/AgeCrypto"
import { WebCryptoSha256Hasher } from "@/external/browser/crypto"
import { history } from "@/external/browser/history"
import { EncryptedKVStore, SingleItemKVStore } from "@/lib/KVStore"
import { BaseContext, type Context } from "@/lib/context"
import { EncryptedFS } from "@/lib/fs/EncryptedFS"
import { toPromise } from "@/lib/result"
import { AttachmentRepo } from "@/storage/database/sqlite/AttachmentRepo"
import { ChangelogRepo } from "@/storage/database/sqlite/ChangelogRepo"
import { MemoRepo } from "@/storage/database/sqlite/MemoRepo"
import { SettingsRepo } from "@/storage/database/sqlite/SettingsRepo"
import * as eventbus from "@/ui/eventbus"
import { actions, configureEffects, configureRootStore } from "@/ui/state"

import type { InitPlatform, PlatformDependencies } from "./init.platform"

declare const __PLATFORM__: "TAURI" | "WEB"

export async function init() {
    let initPlatform: InitPlatform
    if (__PLATFORM__ === "TAURI") {
        initPlatform = (await import("./init.tauri")).init
    } else {
        initPlatform = (await import("./init.web")).init
    }

    let platform = await initPlatform({
        db: {
            onError: (err) => {
                console.error(err)
            },
        },
        fs: {
            baseDir: "conveyor",
            onError: (err) => {
                console.error(err)
            },
        },
    })

    let controller = await initController(platform)
    let rootStore = initRootStore(controller)

    initEventBus(rootStore)

    await tryAutoUnlock(BaseContext, {
        rootStore,
        unlockCtrl: controller.unlockCtrl,
    })

    return { rootStore, attachmentCtrl: controller.attachmentCtrl }
}

async function initController(platform: PlatformDependencies) {
    let crypto = new AgeCrypto()

    let cryptoCtrl = new CryptoController({
        crypto,
    })

    await platform.fs.mkdirp(BaseContext, ".")

    let encryptedFS = new EncryptedFS(platform.fs, cryptoCtrl)

    let authCtrl = new AuthController({
        origin: globalThis.location.host,
        storage: new EncryptedKVStore<{
            [key: string]: AuthToken
        }>({
            kv: platform.kvContainers.permanent.getKVStore("auth"),
            crypto,
            deseerialize: authTokenFromJSON,
        }),
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
        transactioner: platform.db,
        repo: new ChangelogRepo(platform.db),
    })

    let settingsCtrl = new SettingsController({
        transactioner: platform.db,
        repo: new SettingsRepo(platform.db),
        changelog: changelogCtrl,
    })

    let attachmentCtrl = new AttachmentController({
        transactioner: platform.db,
        repo: new AttachmentRepo(platform.db),
        fs: encryptedFS,
        hasher: new WebCryptoSha256Hasher(),
        remote: new EncryptedRemoteAttachmentFetcher({
            syncAPIClient,
            decrypter: cryptoCtrl,
        }),
        changelog: changelogCtrl,
    })

    let memoCtrl = new MemoController({
        transactioner: platform.db,
        repo: new MemoRepo(platform.db),
        attachments: attachmentCtrl,
        changelog: changelogCtrl,
    })

    let syncCtrl = new SyncController({
        storage: new SingleItemKVStore(
            SyncController.storageKey,
            new EncryptedKVStore<
                Record<typeof SyncController.storageKey, SyncInfo>
            >({
                kv: platform.kvContainers.permanent.getKVStore("sync"),
                crypto,
            }),
        ),
        dbPath: "conveyor.db",
        transactioner: platform.db,
        syncAPIClient,
        cryptoRemoteAPI: new AccountKeysV1APIClient({
            baseURL: globalThis.location.href,
            tokenStorage: authCtrl,
        }),
        memos: memoCtrl,
        attachments: attachmentCtrl,
        settings: settingsCtrl,
        changelog: changelogCtrl,
        fs: platform.fs,
        crypto: cryptoCtrl,
    })

    let setupCtrl = new SetupController({
        storage: new SingleItemKVStore(
            SetupController.storageKey,
            platform.kvContainers.fast.getKVStore("setup"),
        ),
    })

    let unlockCtrl = new UnlockController({
        storage: platform.kvContainers.ephemeral.getKVStore("unlock"),
        db: platform.db,
        crypto: cryptoCtrl,
    })

    let apiTokenCtrl = new APITokenController({
        apiTokenAPIClient: new APITokensV1APIClient({
            baseURL: globalThis.location.href,
            tokenStorage: authCtrl,
        }),
    })

    return {
        attachmentCtrl,
        authCtrl,
        memoCtrl,
        settingsCtrl,
        setupCtrl,
        syncCtrl,
        unlockCtrl,
        apiTokenCtrl,
        cryptoCtrl,
    }
}

function initRootStore(controller: {
    memoCtrl: MemoController
    attachmentCtrl: AttachmentController
    settingsCtrl: SettingsController
    syncCtrl: SyncController
    authCtrl: AuthController
    setupCtrl: SetupController
    unlockCtrl: UnlockController
    apiTokenCtrl: APITokenController
}) {
    let rootStore = configureRootStore({
        baseURL:
            globalThis.document
                ?.querySelector("meta[name=base-url]")
                ?.getAttribute("content")
                ?.replace(/\/$/, "") ?? "",
        router: { href: history.current },
    })

    configureEffects(controller)

    return rootStore
}

function initEventBus(rootStore: ReturnType<typeof configureRootStore>) {
    eventbus.on("notifications:add", (notification) => {
        rootStore.dispatch(actions.global.notifications.add({ notification }))
    })
}

async function tryAutoUnlock(
    ctx: Context,
    {
        rootStore,
        unlockCtrl,
    }: {
        rootStore: ReturnType<typeof configureRootStore>
        unlockCtrl: UnlockController
    },
) {
    let tryUnlock = Promise.withResolvers<void>()

    let autoUnlock = await toPromise(unlockCtrl.tryGetPlaintextPrivateKey(ctx))
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
            tryUnlock.resolve()
            return
        }

        if (state.setup.isSetup) {
            unsub()
            rootStore.dispatch(actions.router.goto({ path: "/unlock" }))
            tryUnlock.resolve()
            return
        }

        if (state.setup.step === "initial-setup") {
            unsub()
            rootStore.dispatch(actions.router.goto({ path: "/setup" }))
            tryUnlock.resolve()
        }
    })
}
