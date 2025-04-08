import type { KeyPaths, ValueAt } from "@/lib/getset"

import type { Attachment, AttachmentID } from "./Attachment"
import type { Memo, MemoID } from "./Memo"
import type { Settings } from "./Settings"

export type ChangelogEntryID = string

export type ChangelogTargetType = "memos" | "attachments" | "settings"

export interface ChangelogEntry<
    T extends ChangelogTargetType = ChangelogTargetType,
    ID = string,
    V = unknown,
> {
    id: ChangelogEntryID
    source: string
    revision: number
    targetType: T
    targetID: ID
    value: V
    isSynced: boolean
    syncedAt?: Date
    isApplied: boolean
    appliedAt?: Date
    timestamp: Date
}

export interface ChangelogEntryList {
    items: ChangelogEntry[]
    next?: [number, Date]
}

export type MemoChangelogEntry = ChangelogEntry<
    "memos",
    MemoID,
    | {
          created: Omit<Memo, "id">
      }
    | {
          content: MemoContentChanges
      }
    | {
          isArchived: boolean
      }
    | {
          isDeleted: boolean
      }
>

export type MemoContentChanges = MemoContentChangesV1

export interface MemoContentChangesV1 {
    version: "1"
    changes: MemoContentOpV1[]
}

export type MemoContentOpV1 = {
    insert?: string | Record<string, unknown>
    delete?: number
    retain?: number | Record<string, unknown>
}

export type AttachmentChangelogEntry = ChangelogEntry<
    "attachments",
    AttachmentID,
    | {
          created: Omit<Attachment, "id" | "sha256" | "createdAt"> & {
              sha256: string
          }
      }
    | {
          deleted: true
      }
>

export type SettingChangelogEntry<
    K extends KeyPaths<Settings> = KeyPaths<Settings>,
> = ChangelogEntry<
    "settings",
    K,
    {
        value: ValueAt<Settings, K>
    }
>

export interface EncryptedChangelogEntry {
    syncClientID: string
    data: string
    timestamp: Date
}
