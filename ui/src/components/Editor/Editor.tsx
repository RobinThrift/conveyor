import { Button } from "@/components/Button"
import type { Memo } from "@/domain/Memo"
import type { Tag } from "@/domain/Tag"
import { useStateGetter } from "@/hooks/useStateGetter"
import { useT } from "@/i18n"
import { CaretDoubleRight } from "@phosphor-icons/react"
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
    placholder: string
    placeCursorAt?: { x: number; y: number; snippet?: string }
}

export function Editor(props: EditorProps) {
    let t = useT("components/Editor")

    let [showEditor, setShowEditor] = useState(props.memo.content.length !== 0)

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
                    className="appearance-none w-full min-h-[200px] text-left items-start flex text-subtle-extra-dark font-mono text-[13px] p-1 -mb-[50px] cursor-text"
                >
                    {props.placholder}
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
                placeholder={props.placholder}
                placeCursorAt={props.placeCursorAt}
            />
        )
    }, [
        showEditor,
        props.placholder,
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
        <div className={clsx("editor", props.className)}>
            <Suspense fallback={<div className="w-full min-h-[200px]" />}>
                {editor}
            </Suspense>

            <div className="editor-buttons">
                {props.onCancel && (
                    <Button
                        outline={true}
                        onClick={props.onCancel}
                        variant="danger"
                        size="sm"
                    >
                        {t.Cancel}
                    </Button>
                )}
                <Button
                    variant="primary"
                    size="sm"
                    iconRight={<CaretDoubleRight />}
                    onClick={onSave}
                    disabled={!isChanged}
                >
                    {t.Save}
                </Button>
            </div>
        </div>
    )
}
