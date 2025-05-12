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
import { NavigationController } from "@/control/NavigationController"
import { SettingsController } from "@/control/SettingsController"
import { SetupController } from "@/control/SetupController"
import { SyncController } from "@/control/SyncController"
import {
    UnlockController,
    type Storage as UnlockControllerStorage,
} from "@/control/UnlockController"
import type { SyncInfo } from "@/domain/SyncInfo"
import { WebCryptoSha256Hasher } from "@/external/browser/crypto"
import { EncryptedKVStore, SingleItemKVStore } from "@/lib/KVStore"
import { BaseContext } from "@/lib/context"
import { EncryptedFS } from "@/lib/fs/EncryptedFS"
import { AttachmentRepo } from "@/storage/database/sqlite/AttachmentRepo"
import { ChangelogRepo } from "@/storage/database/sqlite/ChangelogRepo"
import { MemoRepo } from "@/storage/database/sqlite/MemoRepo"
import { SettingsRepo } from "@/storage/database/sqlite/SettingsRepo"

import { Env } from "../env"
import type { PlatformDependencies } from "./platform"

declare const __ENABLE_DB_LOGGING__: boolean

export async function initController(platform: PlatformDependencies) {
    let db: typeof platform.db
    if (__ENABLE_DB_LOGGING__) {
        db = await import("@/lib/testhelper/DBLogger").then(
            ({ DBLogger }) => new DBLogger(platform.db),
        )
        // @ts-expect-error: this is for debugging
        globalThis.__CONVEYOR_DB__ = db
    } else {
        db = platform.db
    }

    let cryptoCtrl = new CryptoController({
        crypto: platform.crypto,
    })

    await platform.fs.mkdirp(BaseContext, ".")

    let encryptedFS = new EncryptedFS(platform.fs, cryptoCtrl)

    let authCtrl = new AuthController({
        origin: globalThis.location.host,
        storage: new EncryptedKVStore<{
            [key: string]: AuthToken
        }>({
            kv: platform.keyValueContainer.getKVStore("auth"),
            crypto: platform.crypto,
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
            decrypter: cryptoCtrl,
        }),
        changelog: changelogCtrl,
    })

    let memoCtrl = new MemoController({
        transactioner: db,
        repo: new MemoRepo(db),
        attachments: attachmentCtrl,
        changelog: changelogCtrl,
    })

    let syncCtrl = new SyncController({
        storage: new SingleItemKVStore(
            SyncController.storageKey,
            new EncryptedKVStore<
                Record<typeof SyncController.storageKey, SyncInfo>
            >({
                kv: platform.keyValueContainer.getKVStore("sync"),
                crypto: platform.crypto,
            }),
        ),
        dbPath: "conveyor.db",
        transactioner: db,
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
            platform.keyValueContainer.getKVStore("setup"),
        ),
    })

    let unlockControllerStorage: UnlockControllerStorage | undefined
    if (Env.isDeviceSecureStorageAvailable) {
        unlockControllerStorage = platform.deviceSecureStorage
    }

    let unlockCtrl = new UnlockController({
        storage: unlockControllerStorage,
        db: db,
        crypto: cryptoCtrl,
    })

    let apiTokenCtrl = new APITokenController({
        apiTokenAPIClient: new APITokensV1APIClient({
            baseURL: globalThis.location.href,
            tokenStorage: authCtrl,
        }),
    })

    let navCtrl = new NavigationController({
        backend: platform.navigationBackend,
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
