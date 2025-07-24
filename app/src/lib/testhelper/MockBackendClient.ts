import { AuthV1APIClient } from "@/api/authv1"
import { APITokensV1APIClient } from "@/api/authv1/APITokensV1APIClient"
import { AccountKeysV1APIClient } from "@/api/authv1/AccountKeysV1APIClient"
import { SyncV1APIClient } from "@/api/syncv1"
import type { AuthToken } from "@/auth"
import type { Notifications } from "@/backend/api"
import type { Events } from "@/backend/types"
import { APITokenController } from "@/control/APITokenController"
import { AttachmentController } from "@/control/AttachmentController"
import { AuthController } from "@/control/AuthController"
import { ChangelogController } from "@/control/ChangelogController"
import { CryptoController } from "@/control/CryptoController"
import { JobController } from "@/control/JobController"
import { MemoController } from "@/control/MemoController"
import { SettingsController } from "@/control/SettingsController"
import { SetupController } from "@/control/SetupController"
import { SyncController } from "@/control/SyncController"
import { UnlockController } from "@/control/UnlockController"
import type { Attachment, AttachmentID } from "@/domain/Attachment"
import type { SetupInfo } from "@/domain/SetupInfo"
import type { SyncInfo } from "@/domain/SyncInfo"
import { AgeCrypto } from "@/external/age/AgeCrypto"
import { WebCryptoSha256Hasher } from "@/external/browser/crypto"
import { SingleItemKVStore } from "@/lib/KVStore"
import { BaseContext, type Context } from "@/lib/context"
import type { PlaintextPrivateKey } from "@/lib/crypto"
import type { DBExec } from "@/lib/database"
import { queueTask } from "@/lib/microtask"
import { type AsyncResult, toPromise } from "@/lib/result"
import { SQLite } from "@/lib/testhelper/sqlite"
import { AttachmentRepo } from "@/storage/database/sqlite/AttachmentRepo"
import { ChangelogRepo } from "@/storage/database/sqlite/ChangelogRepo"
import { MemoRepo } from "@/storage/database/sqlite/MemoRepo"
import { SettingsRepo } from "@/storage/database/sqlite/SettingsRepo"

import { TestInMemKVStore } from "./TestInMemKVStore"
import { generateMockMemos } from "./memos"
import { MockFS } from "./mockfs"

export class MockBackendClient {
    private _db: SQLite
    private _fs: MockFS

    public apiTokens: APITokenController
    public attachments: AttachmentController
    public auth: AuthController
    public changelog: ChangelogController
    public jobs: JobController
    public memos: MemoController
    public settings: SettingsController
    public setup: SetupController
    public sync: SyncController
    public unlock: UnlockController

    private _events: Events<Notifications> = {}

    constructor({
        mockAttachments,
    }: {
        mockAttachments?: Record<
            string,
            () => AsyncResult<{ attachment: Attachment; data: ArrayBufferLike }>
        >
    }) {
        this._db = new SQLite()
        this._fs = new MockFS()

        let crypto = new AgeCrypto()

        let cryptoCtrl = new CryptoController({
            crypto,
        })

        this.changelog = new ChangelogController({
            sourceName: "storybook",
            transactioner: this._db,
            repo: new ChangelogRepo(this._db),
        })

        this.settings = new SettingsController({
            transactioner: this._db,
            repo: new SettingsRepo(this._db),
            changelog: this.changelog,
        })

        this.attachments = new MockAttachmentController({
            transactioner: this._db,
            repo: new AttachmentRepo(this._db),
            fs: this._fs,
            hasher: new WebCryptoSha256Hasher(),
            changelog: this.changelog,
        })

        if (mockAttachments) {
            ;(this.attachments as MockAttachmentController).setMocks(mockAttachments)
        }

        this.memos = new MemoController({
            transactioner: this._db,
            repo: new MemoRepo(this._db),
            attachments: this.attachments,
            changelog: this.changelog,
        })

        this.auth = new AuthController({
            origin: globalThis.location.origin,
            storage: new TestInMemKVStore<{
                [key: string]: AuthToken
            }>(),
            authPIClient: new AuthV1APIClient({
                baseURL: globalThis.location.href,
            }),
        })

        this.sync = new SyncController({
            storage: new SingleItemKVStore<typeof SyncController.storageKey, SyncInfo>(
                SyncController.storageKey,
                new TestInMemKVStore<Record<string, any>>(),
            ),
            dbPath: "test.db",
            transactioner: this._db,
            syncAPIClient: new SyncV1APIClient({
                baseURL: globalThis.location.href,
                tokenStorage: this.auth,
            }),
            cryptoRemoteAPI: new AccountKeysV1APIClient({
                baseURL: globalThis.location.href,
                tokenStorage: this.auth,
            }),
            memos: this.memos,
            attachments: this.attachments,
            settings: this.settings,
            changelog: this.changelog,
            fs: this._fs,
            crypto: cryptoCtrl,
        })

        this.setup = new SetupController({
            storage: new SingleItemKVStore<typeof SetupController.storageKey, SetupInfo>(
                SetupController.storageKey,
                new TestInMemKVStore<Record<string, any>>(),
            ),
        })

        this.unlock = new UnlockController({
            storage: new TestInMemKVStore<{
                "private-key": PlaintextPrivateKey
            }>(),
            db: this._db,
            crypto: cryptoCtrl,
        })

        this.apiTokens = new APITokenController({
            apiTokenAPIClient: new APITokensV1APIClient({
                baseURL: globalThis.location.href,
                tokenStorage: this.auth,
            }),
        })

        this.jobs = new JobController()

        // @ts-expect-error: this is for debugging
        globalThis.__CONVEYOR_DB__ = this._db
    }

    public async init() {
        await this._db.open(BaseContext)
    }

    public generateMockData() {
        return this._insertMockData()
    }

    private async _insertMockData() {
        let { memos } = generateMockMemos()
        for (let memo of memos) {
            await toPromise(this.memos.createMemo(BaseContext, memo))
        }
    }

    public addEventListener<K extends keyof Notifications>(
        event: K,
        cb: (data: Notifications[K]) => void,
    ): () => void {
        if (!this._events[event]) {
            this._events[event] = []
        }
        this._events[event].push(cb)
        return () => {
            if (!this._events[event]) {
                return
            }
            this._events[event] = this._events[event].filter((i) => cb !== i) as any
        }
    }

    public emitEvent<K extends keyof Notifications>(event: K, data: Notifications[K]) {
        this._events[event]?.forEach((handler) => {
            queueTask(() => handler(data))
        })
    }
}

class MockAttachmentController extends AttachmentController {
    private _mocks: Record<
        string,
        () => AsyncResult<{ attachment: Attachment; data: ArrayBufferLike }>
    > = {}

    public setMocks(
        mocks: Record<string, () => AsyncResult<{ attachment: Attachment; data: ArrayBufferLike }>>,
    ) {
        this._mocks = mocks
    }

    public getAttachmentDataByID(
        ctx: Context<{ db?: DBExec }>,
        id: AttachmentID,
    ): AsyncResult<{ attachment: Attachment; data: ArrayBufferLike }> {
        return this._mocks[id]?.() ?? super.getAttachmentDataByID(ctx, id)
    }
}
