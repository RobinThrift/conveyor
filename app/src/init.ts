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
import { JobController } from "@/control/JobController"
import { MemoController } from "@/control/MemoController"
import {
    NavigationController,
    type Params,
    type Restore,
    type Screens,
} from "@/control/NavigationController"
import { SettingsController } from "@/control/SettingsController"
import { SetupController } from "@/control/SetupController"
import { SyncController } from "@/control/SyncController"
import { UnlockController } from "@/control/UnlockController"
import type { SyncInfo } from "@/domain/SyncInfo"
import { AgeCrypto } from "@/external/age/AgeCrypto"
import { HistoryNavigationBackend } from "@/external/browser/HistoryNavigationBackend"
import { WebCryptoSha256Hasher } from "@/external/browser/crypto"
import { EventJobTrigger, ScheduleJobTrigger } from "@/jobs"
import { SyncJob } from "@/jobs/SyncJob"
import { EncryptedKVStore, SingleItemKVStore } from "@/lib/KVStore"
import { BaseContext, type Context } from "@/lib/context"
import { Minute } from "@/lib/duration"
import { EncryptedFS } from "@/lib/fs/EncryptedFS"
import { toPromise } from "@/lib/result"
import { AttachmentRepo } from "@/storage/database/sqlite/AttachmentRepo"
import { ChangelogRepo } from "@/storage/database/sqlite/ChangelogRepo"
import { MemoRepo } from "@/storage/database/sqlite/MemoRepo"
import { SettingsRepo } from "@/storage/database/sqlite/SettingsRepo"
import * as eventbus from "@/ui/eventbus"
import {
    type RootStore,
    actions,
    configureEffects,
    configureRootStore,
} from "@/ui/state"

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
            baseDir: "",
            onError: (err) => {
                console.error(err)
            },
        },
    })

    let controller = await initController(platform)
    let rootStore = initRootStore(controller)

    initEventBus(rootStore)

    initNavgation({ rootStore, navCtrl: controller.navCtrl })

    await tryAutoUnlock(BaseContext, {
        rootStore,
        unlockCtrl: controller.unlockCtrl,
        navCtrl: controller.navCtrl,
    })

    initJobs({ jobCtrl: controller.jobCtrl, rootStore: rootStore })

    return {
        rootStore,
        attachmentCtrl: controller.attachmentCtrl,
        navCtrl: controller.navCtrl,
    }
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

    let navCtrl = new NavigationController({
        backend: new HistoryNavigationBackend<Screens, Params, Restore>({
            fromURLParams: NavigationController.fromURLParams,
            toURLParams: NavigationController.toURLParams,
            screenToURLMapping: NavigationController.screenToURLMapping,
        }),
    })

    let jobCtrl = new JobController()

    return {
        apiTokenCtrl,
        attachmentCtrl,
        authCtrl,
        cryptoCtrl,
        jobCtrl,
        memoCtrl,
        navCtrl,
        settingsCtrl,
        setupCtrl,
        syncCtrl,
        unlockCtrl,
    }
}

function initJobs({
    jobCtrl,
    rootStore,
}: { jobCtrl: JobController; rootStore: RootStore }) {
    window.addEventListener("unload", async () => {
        jobCtrl.stop()
    })

    let syncJob = new SyncJob(rootStore.dispatch)

    jobCtrl.scheduleJob(syncJob, new EventJobTrigger(window, "online"))

    jobCtrl.scheduleJob(syncJob, new ScheduleJobTrigger(5 * Minute))

    jobCtrl.start()
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
    navCtrl: NavigationController
}) {
    let rootStore = configureRootStore()

    configureEffects(controller)

    return rootStore
}

function initEventBus(rootStore: RootStore) {
    eventbus.on("notifications:add", (notification) => {
        rootStore.dispatch(actions.global.notifications.add({ notification }))
    })
}

async function tryAutoUnlock(
    ctx: Context,
    {
        rootStore,
        unlockCtrl,
        navCtrl,
    }: {
        rootStore: ReturnType<typeof configureRootStore>
        unlockCtrl: UnlockController
        navCtrl: NavigationController
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
            navCtrl.push({
                screen: { name: "unlock", params: {} },
                restore: { scrollOffsetTop: 0 },
            })
            tryUnlock.resolve()
            return
        }

        if (state.setup.step === "initial-setup") {
            unsub()
            navCtrl.push({
                screen: { name: "setup", params: {} },
                restore: { scrollOffsetTop: 0 },
            })
            tryUnlock.resolve()
        }
    })
}

function initNavgation({
    rootStore,
    navCtrl,
}: {
    rootStore: ReturnType<typeof configureRootStore>
    navCtrl: NavigationController
}) {
    let init = navCtrl.init()

    rootStore.dispatch(
        actions.navigation.setPage({
            name: init.screen.name,
            params: init.screen.params,
            restore: init.restore,
        }),
    )

    navCtrl.addEventListener("pop", (current) => {
        rootStore.dispatch(
            actions.navigation.setPage({
                name: current.screen.name,
                params: current.screen.params,
                restore: current.restore,
            }),
        )

        document.documentElement.style.setProperty(
            "min-height",
            current.restore.scrollOffsetTop
                ? `${Math.ceil(current.restore.scrollOffsetTop)}px`
                : "initial",
        )
        requestAnimationFrame(() => {
            window.scrollTo(0, Math.ceil(current.restore.scrollOffsetTop ?? 0))
        })
    })

    navCtrl.addEventListener("push", (current) => {
        rootStore.dispatch(
            actions.navigation.setPage({
                name: current.screen.name,
                params: current.screen.params,
                restore: current.restore,
            }),
        )

        document.documentElement.style.setProperty(
            "min-height",
            current.restore.scrollOffsetTop
                ? `${Math.ceil(current.restore.scrollOffsetTop)}px`
                : "initial",
        )
        requestAnimationFrame(() => {
            window.scrollTo(0, Math.ceil(current.restore.scrollOffsetTop ?? 0))
        })
    })
}
