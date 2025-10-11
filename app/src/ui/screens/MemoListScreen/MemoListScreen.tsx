import clsx from "clsx"
import React from "react"

import { AppHeader } from "@/ui/components/AppHeader"
import { PencilIcon, PlusIcon } from "@/ui/components/Icons"
import { LinkButton } from "@/ui/components/Link"
import { MemoList } from "@/ui/components/MemoList"
import { MemoListFilter } from "@/ui/components/MemoListFilter"
import { Header } from "./Header"

export interface MemoListScreenProps {
    className?: string
}

export const MemoListScreen = React.memo(function MemoListScreen(props: MemoListScreenProps) {
    return (
        <div className={clsx("memo-list-screen", props.className)}>
            <MemoListFilter />

            <div className="memo-list-container">
                <Header />

                {/** biome-ignore lint/correctness/useUniqueElementIds: it's unique */}
                <AppHeader position="right" id="new-memo">
                    <div className="new-memo-link-area">
                        <LinkButton
                            screen="memo.new"
                            className="new-memo-link"
                            outline
                            iconRight={<PencilIcon />}
                        >
                            New memo
                        </LinkButton>
                    </div>
                </AppHeader>

                <MemoList />

                <LinkButton
                    screen="memo.new"
                    className="new-memo-editor-fab"
                    iconRight={<PlusIcon weight="bold" />}
                >
                    <span className="sr-only">New memo</span>
                </LinkButton>
            </div>

            <div className="overflow-blur" />
        </div>
    )
})
