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
import { createTracedProxy } from "@/lib/tracing"
import { AttachmentRepo } from "@/storage/database/sqlite/AttachmentRepo"
import { ChangelogRepo } from "@/storage/database/sqlite/ChangelogRepo"
import { MemoRepo } from "@/storage/database/sqlite/MemoRepo"
import { SettingsRepo } from "@/storage/database/sqlite/SettingsRepo"

import { Env } from "../env"
import type { PlatformDependencies } from "./platform"

export async function initController(platform: PlatformDependencies) {
    let db = createTracedProxy(platform.db)

    let cryptoCtrl = createTracedProxy(
        new CryptoController({
            crypto: platform.crypto,
        }),
    )

    await platform.fs.mkdirp(BaseContext, ".")

    let encryptedFS = createTracedProxy(
        new EncryptedFS(platform.fs, cryptoCtrl),
    )

    let authCtrl = createTracedProxy(
        new AuthController({
            origin: globalThis.location.host,
            storage: createTracedProxy(
                new EncryptedKVStore<{
                    [key: string]: AuthToken
                }>({
                    kv: platform.keyValueContainer.getKVStore("auth"),
                    crypto: platform.crypto,
                    deserialize: authTokenFromJSON,
                }),
            ),
            authPIClient: createTracedProxy(
                new AuthV1APIClient({
                    baseURL: globalThis.location.href,
                }),
            ),
        }),
    )

    let syncAPIClient = createTracedProxy(
        new SyncV1APIClient({
            baseURL: globalThis.location.href,
            tokenStorage: authCtrl,
        }),
    )

    let changelogCtrl = createTracedProxy(
        new ChangelogController({
            sourceName: "web",
            transactioner: db,
            repo: createTracedProxy(new ChangelogRepo(db)),
        }),
    )

    let settingsCtrl = createTracedProxy(
        new SettingsController({
            transactioner: db,
            repo: createTracedProxy(new SettingsRepo(db)),
            changelog: changelogCtrl,
        }),
    )

    let attachmentCtrl = createTracedProxy(
        new AttachmentController({
            transactioner: db,
            repo: createTracedProxy(new AttachmentRepo(db)),
            fs: encryptedFS,
            hasher: createTracedProxy(new WebCryptoSha256Hasher()),
            remote: createTracedProxy(
                new EncryptedRemoteAttachmentFetcher({
                    syncAPIClient,
                    decrypter: cryptoCtrl,
                }),
            ),
            changelog: changelogCtrl,
        }),
    )

    let memoCtrl = createTracedProxy(
        new MemoController({
            transactioner: db,
            repo: createTracedProxy(new MemoRepo(db)),
            attachments: attachmentCtrl,
            changelog: changelogCtrl,
        }),
    )

    let syncCtrl = createTracedProxy(
        new SyncController({
            storage: createTracedProxy(
                new SingleItemKVStore(
                    SyncController.storageKey,
                    new EncryptedKVStore<
                        Record<typeof SyncController.storageKey, SyncInfo>
                    >({
                        kv: platform.keyValueContainer.getKVStore("sync"),
                        crypto: platform.crypto,
                    }),
                ),
            ),
            dbPath: "conveyor.db",
            transactioner: db,
            syncAPIClient,
            cryptoRemoteAPI: createTracedProxy(
                new AccountKeysV1APIClient({
                    baseURL: globalThis.location.href,
                    tokenStorage: authCtrl,
                }),
            ),
            memos: memoCtrl,
            attachments: attachmentCtrl,
            settings: settingsCtrl,
            changelog: changelogCtrl,
            fs: platform.fs,
            crypto: cryptoCtrl,
        }),
    )

    let setupCtrl = createTracedProxy(
        new SetupController({
            storage: createTracedProxy(
                new SingleItemKVStore(
                    SetupController.storageKey,
                    platform.keyValueContainer.getKVStore("setup"),
                ),
            ),
        }),
    )

    let unlockControllerStorage: UnlockControllerStorage | undefined
    if (Env.isDeviceSecureStorageAvailable) {
        unlockControllerStorage = createTracedProxy(
            platform.deviceSecureStorage,
        )
    }

    let unlockCtrl = createTracedProxy(
        new UnlockController({
            storage: unlockControllerStorage,
            db: db,
            crypto: cryptoCtrl,
        }),
    )

    let apiTokenCtrl = createTracedProxy(
        new APITokenController({
            apiTokenAPIClient: createTracedProxy(
                new APITokensV1APIClient({
                    baseURL: globalThis.location.href,
                    tokenStorage: authCtrl,
                }),
            ),
        }),
    )

    let navCtrl = createTracedProxy(
        new NavigationController({
            backend: platform.navigationBackend,
        }),
    )

    let jobCtrl = createTracedProxy(new JobController())

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
        changelogCtrl,
    }
}
