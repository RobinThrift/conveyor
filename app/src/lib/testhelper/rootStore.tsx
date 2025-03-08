import type { Decorator } from "@storybook/react"
import React from "react"

import { AttachmentController } from "@/control/AttachmentController"
import { ChangelogController } from "@/control/ChangelogController"
import { MemoController } from "@/control/MemoController"
import { SettingsController } from "@/control/SettingsController"
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

        if (props.generateMockData) {
            await insertMockData({ memoCtrl })
        }

        configureEffects({
            memoCtrl,
            attachmentCtrl,
            settingsCtrl,
        })

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
