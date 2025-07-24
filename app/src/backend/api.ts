import type { APITokenController } from "@/control/APITokenController"
import type { AttachmentController } from "@/control/AttachmentController"
import type { AuthController } from "@/control/AuthController"
import type { ChangelogController } from "@/control/ChangelogController"
import type { CryptoController } from "@/control/CryptoController"
import type { JobController } from "@/control/JobController"
import type { MemoController } from "@/control/MemoController"
import type { SettingsController } from "@/control/SettingsController"
import type { SetupController } from "@/control/SetupController"
import type { SyncController } from "@/control/SyncController"
import type { UnlockController } from "@/control/UnlockController"
import type { Memo } from "@/domain/Memo"
import type { Settings } from "@/domain/Settings"
import type { SyncInfo } from "@/domain/SyncInfo"
import type { Context } from "@/lib/context"
import type { KeyPaths } from "@/lib/getset"
import type { AsyncResult } from "@/lib/result"

export type API = {
    APITokenController: AsyncMethods<
        Pick<APITokenController, "listAPITokens" | "createAPIToken" | "deleteAPIToken">
    >
    AttachmentController: AsyncMethods<
        Pick<AttachmentController, "getAttachmentDataByID" | "createAttachment">
    >
    AuthController: AsyncMethods<
        Pick<AuthController, "changePassword" | "reset" | "getInitialToken" | "setOrigin">
    >
    ChangelogController: AsyncMethods<
        Pick<ChangelogController, "deleteChangelogEntry" | "listUnsyncedChangelogEntries">
    >
    CryptoController: AsyncMethods<Pick<CryptoController, "init">>
    JobController: AsyncMethods<Pick<JobController, "startJob">>
    MemoController: AsyncMethods<
        Pick<
            MemoController,
            | "getMemo"
            | "listMemos"
            | "listTags"
            | "createMemo"
            | "updateMemoContent"
            | "updateMemoArchiveStatus"
            | "deleteMemo"
            | "undeleteMemo"
        >
    >
    SettingsController: AsyncMethods<Pick<SettingsController, "loadSettings" | "updateSetting">>
    SetupController: AsyncMethods<Pick<SetupController, "loadSetupInfo" | "saveSetupInfo">>
    SyncController: AsyncMethods<
        Pick<SyncController, "init" | "load" | "sync" | "fetchFullDB" | "reset" | "uploadFullDB">
    >
    UnlockController: AsyncMethods<Pick<UnlockController, "unlock">>
}

export type Notifications = {
    "settings/onSettingChanged": {
        key: KeyPaths<Settings>
        value: any
    }

    "memos/updated": {
        memo: Memo
    }

    "memos/created": {
        memo: Memo
    }

    "init/autoUnlock":
        | { isSetup: false }
        | {
              isSetup: true
              isUnlocked: boolean
              settings?: {
                  values: Settings
              }
              sync?: SyncInfo
          }

    "job/start": { name: string }
    "job/end": { name: string }
    "job/error": { name: string; error: Error }
}

export type ClientNotifications = {
    "ui/visibliyChanged": undefined
    "ui/online": undefined
}

export function getMethod<T extends keyof API>(
    action: string,
): { namespace: T; method: keyof API[T] } {
    let [namespace, method] = action.split("/", 2)
    return { namespace: namespace as T, method: method as keyof API[T] }
}

type AsyncMethods<T extends object> = {
    [K in keyof T]: K extends string
        ? T[K] extends (ctx: Context, ...args: any[]) => AsyncResult<any>
            ? T[K]
            : unknown
        : never
}
