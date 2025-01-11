import { AlertDialog } from "@/components/AlertDialog"
import { Button } from "@/components/Button"
import type { Memo } from "@/domain/Memo"
import type { Tag } from "@/domain/Tag"
import { useStateGetter } from "@/hooks/useStateGetter"
import { useT } from "@/i18n"
import { ArrowLeft, Check, X } from "@phosphor-icons/react"
import clsx from "clsx"
import React, {
    useCallback,
    useEffect,
    useState,
    lazy,
    Suspense,
    useMemo,
    startTransition,
} from "react"

const TextEditor = lazy(() =>
    import("./TextEditor").then(({ TextEditor }) => ({ default: TextEditor })),
)

export interface EditorProps {
    className?: string
    tags: Tag[]
    memo: Memo
    onSave: (memo: Memo) => void
    onCancel?: () => void
    autoFocus?: boolean
    placeholder: string
    placeCursorAt?: { x: number; y: number; snippet?: string }
    lazy?: boolean
    buttonPosition?: "top" | "bottom"
}

export function Editor(props: EditorProps) {
    let t = useT("components/Editor")

    let [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false)

    let confirmDiscard = useCallback(() => {
        setConfirmationDialogOpen(false)
        props.onCancel?.()
    }, [props.onCancel])

    let [showEditor, setShowEditor] = useState(
        !(props.lazy ?? true) || props.memo.content.length !== 0,
    )

    let [isChanged, setIsChanged] = useState(false)
    let [content, setContent] = useStateGetter(props.memo.content ?? "")

    let onSave = useCallback(() => {
        props.onSave({
            ...props.memo,
            content: content(),
        })
    }, [props.onSave, props.memo, content])

    let onCancel = useCallback(() => {
        if (isChanged) {
            setConfirmationDialogOpen(true)
            return
        }
        props.onCancel?.()
    }, [props.onCancel, isChanged])

    // biome-ignore lint/correctness/useExhaustiveDependencies: this is intentional
    useEffect(() => {
        setIsChanged(false)
        setContent(props.memo.content)
    }, [props.memo.id, props.memo.content, setContent])

    let onChange = useCallback(
        (content: string) => {
            setContent(content)
            setIsChanged(true)
        },
        [setContent],
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: extra dependency so the editor can be cleared when used to create a new memo.
    let editor = useMemo(() => {
        if (!showEditor) {
            return (
                <button
                    onClick={() => startTransition(() => setShowEditor(true))}
                    onFocus={() => startTransition(() => setShowEditor(true))}
                    type="button"
                    className="placeholder-btn"
                >
                    {props.placeholder}
                </button>
            )
        }

        return (
            <TextEditor
                id={props.memo.id}
                tags={props.tags}
                content={content()}
                onChange={onChange}
                onCancel={onCancel}
                onSave={onSave}
                autoFocus={props.autoFocus}
                placeholder={props.placeholder}
                placeCursorAt={props.placeCursorAt}
            />
        )
    }, [
        showEditor,
        props.placeholder,
        onSave,
        onCancel,
        props.memo.id,
        props.tags,
        props.autoFocus,
        props.placeCursorAt,
        onChange,
        content(),
    ])

    return (
        <div
            className={clsx(
                "editor",
                {
                    "showing-placeholder": !showEditor,
                },
                props.className,
            )}
        >
            {showEditor && (
                <div
                    className={clsx("editor-buttons", {
                        "position-bottom": props.buttonPosition === "top",
                    })}
                >
                    {props.onCancel && (
                        <Button
                            onClick={onCancel}
                            variant="danger"
                            plain
                            aria-label={t.Cancel}
                            iconLeft={
                                <>
                                    <X
                                        weight="fill"
                                        className="hidden tablet:block"
                                    />
                                    <ArrowLeft className="tablet:hidden" />
                                </>
                            }
                        >
                            <span className="sr-only tablet:not-sr-only">
                                {t.Cancel}
                            </span>
                        </Button>
                    )}

                    <Button
                        aria-label={t.Save}
                        onClick={onSave}
                        plain
                        iconLeft={<Check />}
                        disabled={!isChanged}
                    >
                        <span className="sr-only tablet:not-sr-only">
                            {t.Save}
                        </span>
                    </Button>
                </div>
            )}
            <Suspense fallback={<div className="w-full min-h-full" />}>
                {editor}
            </Suspense>

            <AlertDialog
                open={confirmationDialogOpen}
                onOpenChange={setConfirmationDialogOpen}
            >
                <AlertDialog.Content>
                    <AlertDialog.Title>
                        {t.DiscardChangesTitle}
                    </AlertDialog.Title>

                    <AlertDialog.Description>
                        {t.DiscardChangesDescription}
                    </AlertDialog.Description>

                    <AlertDialog.Buttons>
                        <Button variant="danger" onClick={confirmDiscard}>
                            {t.DiscardChangesConfirmation}
                        </Button>
                        <AlertDialog.CancelButton>
                            {t.Cancel}
                        </AlertDialog.CancelButton>
                    </AlertDialog.Buttons>
                </AlertDialog.Content>
            </AlertDialog>
        </div>
    )
}
