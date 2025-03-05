import type { KeyPaths, ValueAt } from "@/lib/getset"

import type { Attachment, AttachmentID } from "./Attachment"
import type { Memo, MemoID } from "./Memo"
import type { Settings } from "./Settings"

export type ChangelogEntryID = string

export interface ChangelogEntry<
    T extends string = string,
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
    next?: number
}

export type MemoChangelogEntry = ChangelogEntry<
    "memos",
    MemoID,
    | {
          created: Memo
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

export interface MemoContentChanges {
    version: "1"
    changes: (number | [number, ...string[]])[]
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
