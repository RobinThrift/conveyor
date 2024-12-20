import { Button } from "@/components/Button"
import type { Memo } from "@/domain/Memo"
import type { Tag } from "@/domain/Tag"
import { useStateGetter } from "@/hooks/useStateGetter"
import { useT } from "@/i18n"
import { FloppyDisk, X } from "@phosphor-icons/react"
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
        props.onCancel?.()
    }, [props.onCancel])

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
            <Suspense fallback={<div className="w-full min-h-full" />}>
                {editor}
            </Suspense>

            {showEditor && (
                <div
                    className={clsx("editor-buttons", {
                        "position-top": props.buttonPosition === "top",
                    })}
                >
                    {props.onCancel && (
                        <Button
                            onClick={props.onCancel}
                            variant="danger"
                            plain
                            aria-label={t.Cancel}
                            iconLeft={<X weight="fill" />}
                        >
                            {t.Cancel}
                        </Button>
                    )}

                    <Button
                        aria-label={t.Save}
                        outline
                        onClick={onSave}
                        plain
                        iconLeft={<FloppyDisk weight="fill" />}
                        disabled={!isChanged}
                    >
                        {t.Save}
                    </Button>
                </div>
            )}
        </div>
    )
}
