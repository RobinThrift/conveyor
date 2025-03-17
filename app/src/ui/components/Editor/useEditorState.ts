import type { MemoContentChanges } from "@/domain/Changelog"
import type { Memo } from "@/domain/Memo"
import { diff } from "@/external/quill"
import { useStateGetter } from "@/ui/hooks/useStateGetter"
import type { ChangeSet } from "@codemirror/state"
import { useCallback, useEffect, useState } from "react"

export function useEditorState(props: {
    memo: Memo
    onSave: (memo: Memo, changeset: MemoContentChanges) => void
    onCancel?: () => void
}) {
    let [confirmationDialogIsOpen, setConfirmationDialogIsOpen] =
        useState(false)

    let confirmDiscard = useCallback(() => {
        setConfirmationDialogIsOpen(false)
        props.onCancel?.()
    }, [props.onCancel])

    let [isChanged, setIsChanged] = useState(false)
    let [content, setContent] = useStateGetter(props.memo.content ?? "")
    let [changeset, setChangeset] = useStateGetter<ChangeSet | undefined>(
        undefined,
    )

    let onSave = useCallback(() => {
        let changes: MemoContentChanges = {
            version: "1",
            changes: diff(props.memo.content, content()),
        }
        props.onSave(
            {
                ...props.memo,
                content: content(),
            },
            changes,
        )
    }, [props.onSave, props.memo, content])

    let onCancel = useCallback(() => {
        if (isChanged) {
            setConfirmationDialogIsOpen(true)
            return
        }
        props.onCancel?.()
    }, [props.onCancel, isChanged])

    // biome-ignore lint/correctness/useExhaustiveDependencies: this is intentional
    useEffect(() => {
        setIsChanged(false)
        setContent(props.memo.content)
        setChangeset(undefined)
    }, [props.memo.id, props.memo.content, setContent, setChangeset])

    let onChange = useCallback(
        (content: string, newChangeset: ChangeSet) => {
            setContent(content)
            setIsChanged(true)
            let c = changeset()
            if (c) {
                setChangeset(c.compose(newChangeset))
            } else {
                setChangeset(newChangeset)
            }
        },
        [setContent, changeset, setChangeset],
    )

    return {
        confirmationDialog: {
            isOpen: confirmationDialogIsOpen,
            setIsOpen: setConfirmationDialogIsOpen,
            discard: confirmDiscard,
        },
        onSave,
        onCancel,
        onChange,
        isChanged,
        setIsChanged,
        content,
    }
}
