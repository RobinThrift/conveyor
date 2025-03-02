import type { KeyPaths, ValueAt } from "@/lib/getset"

import type { AttachmentID } from "./Attachment"
import type { MemoID } from "./Memo"
import type { Settings } from "./Settings"

export interface ChangelogEntry<
    T extends string = string,
    ID = string,
    V = unknown,
> {
    source: string
    revision: number
    targetType: T
    targetID: ID
    value: V
    synced: boolean
    applied: boolean
}

export interface ChangelogEntryList {
    items: ChangelogEntry[]
    next?: number
}

export type MemoChangelogEntry = ChangelogEntry<
    "memos",
    MemoID,
    MemoContentChanges
>

export interface MemoContentChanges {
    version: "1"
    changes: (number | [number, ...string[]])[]
}

export type AttachmentChangelogEntry = ChangelogEntry<
    "attachments",
    AttachmentID,
    {
        method: "created" | "deleted"
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
