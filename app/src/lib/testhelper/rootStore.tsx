import type { Decorator } from "@storybook/react"
import React from "react"

import { AttachmentController } from "@/control/AttachmentController"
import { ChangelogController } from "@/control/ChangelogController"
import { MemoController } from "@/control/MemoController"
import { SettingsController } from "@/control/SettingsController"
import type { SyncInfo } from "@/domain/SyncInfo"
import { WebCryptoSha256Hasher } from "@/external/browser/crypto"
import { history } from "@/external/browser/history"
import { BaseContext } from "@/lib/context"
import { toPromise } from "@/lib/result"
import { generateMockMemos } from "@/lib/testhelper/memos"
import { SQLite } from "@/lib/testhelper/sqlite"
import { AttachmentRepo } from "@/storage/database/sqlite/AttachmentRepo"
import { ChangelogRepo } from "@/storage/database/sqlite/ChangelogRepo"
import { MemoRepo } from "@/storage/database/sqlite/MemoRepo"
import { SettingsRepo } from "@/storage/database/sqlite/SettingsRepo"
import {
    AttachmentProvider,
    attachmentContextFromController,
} from "@/ui/attachments"
import { Alert } from "@/ui/components/Alert"
import { usePromise } from "@/ui/hooks/usePromise"
import { SettingsLoader } from "@/ui/settings"
import { configureEffects, configureRootStore } from "@/ui/state"
import { Provider } from "@/ui/state"

import { AuthV1APIClient } from "@/api/authv1"
import { APITokensV1APIClient } from "@/api/authv1/APITokensV1APIClient"
import { AccountKeysV1APIClient } from "@/api/authv1/AccountKeysV1APIClient"
import { SyncV1APIClient } from "@/api/syncv1"
import type { AuthToken } from "@/auth"
import { APITokenController } from "@/control/APITokenController"
import { AuthController } from "@/control/AuthController"
import { CryptoController } from "@/control/CryptoController"
import { SetupController } from "@/control/SetupController"
import { SyncController } from "@/control/SyncController"
import { UnlockController } from "@/control/UnlockController"
import type { SetupInfo } from "@/domain/SetupInfo"
import { AgeCrypto } from "@/external/age/AgeCrypto"
import { SingleItemKVStore } from "@/lib/KVStore"
import type { PlaintextPrivateKey } from "@/lib/crypto"

import { TestInMemKVStore } from "./TestInMemKVStore"
import { MockFS } from "./mockfs"

export interface MockRootStoreProviderProps {
    generateMockData?: boolean
    children: React.ReactNode | React.ReactNode[]
}

export function MockRootStoreProvider(props: MockRootStoreProviderProps) {
    let setup = usePromise(async () => {
        let db = new SQLite()

        await db.open(BaseContext)

        let mockFS = new MockFS()

        let crypto = new AgeCrypto()

        let cryptoCtrl = new CryptoController({
            crypto,
        })

        let rootStore = configureRootStore({
            router: { href: history.current },
        })

        let changelogCtrl = new ChangelogController({
            sourceName: "storybook",
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
            fs: mockFS,
            hasher: new WebCryptoSha256Hasher(),
            changelog: changelogCtrl,
        })

        let memoCtrl = new MemoController({
            transactioner: db,
            repo: new MemoRepo(db),
            attachments: attachmentCtrl,
            changelog: changelogCtrl,
        })

        let authCtrl = new AuthController({
            origin: globalThis.location.origin,
            storage: new TestInMemKVStore<{
                [key: string]: AuthToken
            }>(),
            authPIClient: new AuthV1APIClient({
                baseURL: globalThis.location.href,
            }),
        })

        let syncCtrl = new SyncController({
            storage: new SingleItemKVStore<
                typeof SyncController.storageKey,
                SyncInfo
            >(
                SyncController.storageKey,
                new TestInMemKVStore<Record<string, any>>(),
            ),
            dbPath: "test.db",
            transactioner: db,
            syncAPIClient: new SyncV1APIClient({
                baseURL: globalThis.location.href,
                tokenStorage: authCtrl,
            }),
            cryptoRemoteAPI: new AccountKeysV1APIClient({
                baseURL: globalThis.location.href,
                tokenStorage: authCtrl,
            }),
            memos: memoCtrl,
            attachments: attachmentCtrl,
            settings: settingsCtrl,
            changelog: changelogCtrl,
            fs: mockFS,
            crypto: cryptoCtrl,
        })

        let setupCtrl = new SetupController({
            storage: new SingleItemKVStore<
                typeof SetupController.storageKey,
                SetupInfo
            >(
                SetupController.storageKey,
                new TestInMemKVStore<Record<string, any>>(),
            ),
        })

        let unlockCtrl = new UnlockController({
            storage: new TestInMemKVStore<{
                "private-key": PlaintextPrivateKey
            }>(),
            db,
            crypto: cryptoCtrl,
        })

        let apiTokenCtrl = new APITokenController({
            apiTokenAPIClient: new APITokensV1APIClient({
                baseURL: globalThis.location.href,
                tokenStorage: authCtrl,
            }),
        })

        if (props.generateMockData) {
            await insertMockData({ memoCtrl })
        }

        configureEffects({
            memoCtrl,
            attachmentCtrl,
            settingsCtrl,
            syncCtrl,
            authCtrl,
            setupCtrl,
            unlockCtrl,
            apiTokenCtrl,
        })

        // @ts-expect-error: this is for debugging
        globalThis.__CONVEYOR_DB__ = db

        return { rootStore, attachmentCtrl }
    }, [])

    if (!setup.resolved) {
        return null
    }

    if (setup.error) {
        return <Alert variant="danger">{setup.error.message}</Alert>
    }

    let { rootStore, attachmentCtrl } = setup.result

    return (
        <Provider store={rootStore}>
            <AttachmentProvider
                value={attachmentContextFromController(attachmentCtrl)}
            >
                <SettingsLoader>{props.children}</SettingsLoader>
            </AttachmentProvider>
        </Provider>
    )
}

export const decorator: Decorator = (Story) => (
    <MockRootStoreProvider>
        <Story />
    </MockRootStoreProvider>
)

export const decoratorWithMockData: Decorator = (Story) => (
    <MockRootStoreProvider generateMockData={true}>
        <Story />
    </MockRootStoreProvider>
)

async function insertMockData({
    memoCtrl,
}: {
    memoCtrl: MemoController
}) {
    let { memos } = generateMockMemos()
    for (let memo of memos) {
        await toPromise(memoCtrl.createMemo(BaseContext, memo))
    }
}
