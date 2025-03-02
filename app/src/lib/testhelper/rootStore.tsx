import type { Decorator } from "@storybook/react"
import React from "react"

import { history } from "@/external/browser/history"
import { BaseContext } from "@/lib/context"
import { toPromise } from "@/lib/result"
import { generateMockMemos } from "@/lib/testhelper/memos"
import { SQLite } from "@/lib/testhelper/sqlite"
import { AttachmentStorage } from "@/storage/attachments"
import { ChangelogStorage } from "@/storage/changelog"
import * as attachmentRepo from "@/storage/database/sqlite/attachmentRepo"
import * as changelogRepo from "@/storage/database/sqlite/changelogRepo"
import * as memoRepo from "@/storage/database/sqlite/memoRepo"
import { MemoStorage } from "@/storage/memos"
import {
    AttachmentProvider,
    attachmentContextFromStorage,
} from "@/ui/attachments"
import { Alert } from "@/ui/components/Alert"
import { usePromise } from "@/ui/hooks/usePromise"
import { configureRootStore, initializeStorage } from "@/ui/state"
import { Provider } from "@/ui/state"
import { MockFS } from "./mockfs"

export interface MockRootStoreProviderProps {
    generateMockData?: boolean
    children: React.ReactNode | React.ReactNode[]
}

export function MockRootStoreProvider(props: MockRootStoreProviderProps) {
    let setup = usePromise(async () => {
        let sqlite = new SQLite()

        await sqlite.open()

        let mockFS = new MockFS()

        let rootStore = configureRootStore({
            router: { href: history.current },
        })

        let changelog = new ChangelogStorage({
            sourceName: "storybook",
            db: sqlite,
            repo: changelogRepo,
        })

        let attachmentStorage = new AttachmentStorage({
            db: sqlite,
            repo: attachmentRepo,
            fs: mockFS,
            changelog,
        })

        let memoStorage = new MemoStorage({
            db: sqlite,
            repo: memoRepo,
            attachments: attachmentStorage,
            changelog,
        })

        if (props.generateMockData) {
            await insertMockData({ memoStorage })
        }

        initializeStorage({
            memoStorage,
            attachmentStorage,
        })

        return { rootStore, attachmentStorage }
    }, [])

    if (!setup.resolved) {
        return null
    }

    if (setup.error) {
        return <Alert variant="danger">{setup.error.message}</Alert>
    }

    let { rootStore, attachmentStorage } = setup.result

    return (
        <Provider store={rootStore}>
            <AttachmentProvider
                value={attachmentContextFromStorage(attachmentStorage)}
            >
                {props.children}
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
    memoStorage,
}: {
    memoStorage: MemoStorage
}) {
    let { memos } = generateMockMemos()
    for (let memo of memos) {
        await toPromise(
            memoStorage.createMemo(BaseContext.withData("db", undefined), memo),
        )
    }
}
