import { useStore } from "@tanstack/react-store"
import clsx from "clsx"
import React, { Activity, useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Temporal } from "temporal-polyfill"

import type { MemoContentChanges } from "@/domain/Changelog"
import type { MemoID, Memo as MemoT } from "@/domain/Memo"
import { useAttachmentTransferer } from "@/ui/attachments"
import { Button } from "@/ui/components/Button"
import { Editor } from "@/ui/components/Editor"
import { XIcon } from "@/ui/components/Icons"
import { TOC } from "@/ui/components/Markdown/TOC"
import {
    Memo,
    MemoActionsDropdown,
    MemoBody,
    MemoDate,
    MemoHeader,
    MemoTitle,
} from "@/ui/components/Memo"
import { OverFlowMask } from "@/ui/components/OverflowMask"
import { TopBar } from "@/ui/components/TopBar"
import { useIsMobile } from "@/ui/hooks/useIsMobile"
import { useT } from "@/ui/i18n"
import { actions, selectors, stores } from "@/ui/stores"

export function MemoScreen() {
    let openMemos = useStore(stores.ui.openMemos)
    let activeMemos = useStore(stores.ui.activeMemos)

    return (
        <div className="screen memo-screen">
            <div className="open-memo-tab-panels">
                {openMemos.map((memoID) => (
                    <MemoTabPanel
                        key={memoID}
                        memoID={memoID}
                        isActive={activeMemos.includes(memoID)}
                    />
                ))}
            </div>
        </div>
    )
}

function MemoTabPanel({ memoID, isActive }: { memoID: MemoID; isActive: boolean }) {
    let memo = useStore(stores.memos.memos, selectors.memos.get(memoID))
    let isEditing = useStore(stores.memos.memos, selectors.memos.isEditing(memoID))
    let startEditAt = useStore(stores.memos.memos, selectors.memos.startEditAt(memoID))
    let offsetScrollTop = useStore(
        stores.ui.memoTabScrollOffsets,
        (s) => s[memoID]?.scrollOffsetTop ?? 0,
    )
    let { ref } = useMemoTabPanel({ memoID, isActive })

    // biome-ignore lint/correctness/useExhaustiveDependencies: this is intentional to prevent rerenders
    useEffect(() => {
        if (isActive) {
            window.scrollTo({ top: offsetScrollTop, behavior: "instant" })
        }
    }, [isActive])

    return (
        <Activity mode={isActive ? "visible" : "hidden"}>
            <div
                className={clsx("memo-tab-panel memo-tab-back-progress-target", {
                    hidden: !isActive,
                })}
                tabIndex={isActive ? 0 : -1}
                role="tabpanel"
                id={`tab-panel-${memo.id}`}
                aria-labelledby={`tab-${memo.id}`}
                aria-hidden={isActive ? "false" : "true"}
            >
                <div className="memo-tab-panel-memo">
                    {isEditing ? (
                        <MemoEditor memo={memo} placeCursorAt={startEditAt} />
                    ) : (
                        <Memo memo={memo}>
                            {({ id, title, createdAt, body, offset, onDoubleClick }) => (
                                <>
                                    <TopBar>
                                        <CloseMemoTabPanelButton memoID={memoID} />
                                    </TopBar>
                                    <TopBar>
                                        <MemoActionsDropdown memo={memo} />
                                    </TopBar>
                                    <FloatingMemoTitle createdAt={createdAt} title={title} />
                                    <TOC document={body} id={id} />
                                    <MemoBody id={id} onDoubleClick={onDoubleClick} offset={offset}>
                                        {body}
                                    </MemoBody>
                                </>
                            )}
                        </Memo>
                    )}
                </div>

                <div ref={ref} className="memo-screen-drag-handle" />

                <OverFlowMask className="memo-screen-oveflow-mask" dir="top" />
            </div>
        </Activity>
    )
}

const maxMobileTitleLength = 45

const FloatingMemoTitle = React.memo(function FloatingMemoTitle({
    createdAt,
    title,
}: {
    createdAt: Temporal.ZonedDateTime
    title?: string
}) {
    let [isVisible, setIsVisible] = useState(true)
    let [targetRect, setTargetRect] = useState({ top: 0, height: 0, width: 0 })

    let targetRef = useRef<null | HTMLHeadingElement>(null)
    let triggerRef = useRef<null | HTMLDivElement>(null)

    useEffect(() => {
        if (!targetRef.current) {
            return
        }

        let observer = new ResizeObserver((entries) => {
            let top = entries[0].contentRect.top
            let rect = entries[0].borderBoxSize[0]

            setTargetRect({
                top,
                width: rect.inlineSize,
                height: rect.blockSize,
            })

            observer.disconnect()
        })

        observer.observe(targetRef.current)

        return () => {
            observer.disconnect()
        }
    }, [])

    useEffect(() => {
        if (!triggerRef.current || !targetRef.current) {
            return
        }

        let observer = new IntersectionObserver(
            (entries: IntersectionObserverEntry[]) => {
                setIsVisible(entries[0].intersectionRatio > 0)
            },
            {
                threshold: [0.0, 0.05],
            },
        )

        observer.observe(triggerRef.current)

        return () => {
            observer.disconnect()
        }
    }, [])

    let trimmed = useMemo(() => {
        if (!title) {
            return
        }

        if (title.length < maxMobileTitleLength) {
            return title
        }

        let trimmed = title.substring(0, maxMobileTitleLength)

        let lastSpace = trimmed.lastIndexOf(" ")
        if (lastSpace === -1) {
            return trimmed
        }

        trimmed = trimmed.substring(0, lastSpace)

        return `${trimmed}...`
    }, [title])

    return (
        <>
            <div
                ref={triggerRef}
                aria-hidden="true"
                className="memo-title-float-trigger"
                style={{
                    top: CSS.px(targetRect.top).toString(),
                    width: CSS.px(targetRect.width).toString(),
                    height: CSS.px(targetRect.height).toString(),
                }}
            />

            <MemoHeader
                ref={targetRef}
                style={{
                    width: !isVisible ? CSS.px(targetRect.width).toString() : "",
                    height: !isVisible ? CSS.px(targetRect.height).toString() : "",
                }}
            >
                {title && (
                    <MemoTitle className={clsx({ "is-floating": !isVisible })}>
                        {isVisible ? title : trimmed}
                    </MemoTitle>
                )}

                <MemoDate createdAt={createdAt} className={clsx({ "is-floating": !isVisible })} />
            </MemoHeader>
        </>
    )
})

function CloseMemoTabPanelButton({ memoID }: { memoID: MemoID }) {
    let t = useT("components/MemoTabPanel")

    let isMobile = useIsMobile()
    let onClick = useCallback(() => {
        if (isMobile) {
            document.documentElement.classList.add("mobile-close-memo-transition")
            document
                .startViewTransition(() => {
                    actions.ui.closeMemo(memoID)
                })
                .finished.then(() =>
                    document.documentElement.classList.remove("mobile-close-memo-transition"),
                )
        } else {
            requestAnimationFrame(() => {
                actions.ui.closeMemo(memoID)
            })
        }
    }, [isMobile, memoID])

    return (
        <div className="memo-tab-panel-close-btn">
            <Button type="button" onClick={onClick} iconRight={<XIcon />} aria-label={t.Close} />
        </div>
    )
}

function MemoEditor(props: {
    memo: MemoT
    placeCursorAt?: { x?: number; y?: number; snippet?: string }
}) {
    let tags = useStore(stores.tags.tags)
    let isNew = useStore(stores.memos.memos, selectors.memos.isNew(props.memo.id))

    let onSave = useCallback((memo: MemoT, changeset: MemoContentChanges) => {
        actions.memos.updateContent(memo, changeset)
    }, [])

    let onCancel = useCallback(() => {
        if (isNew) {
            actions.ui.closeMemo(props.memo.id)
        }

        actions.memos.cancelEdit(props.memo.id)
    }, [props.memo.id, isNew])

    let vimModeEnabled = useStore(stores.settings.values, selectors.settings.value("controls.vim"))

    let transferAttachment = useAttachmentTransferer()

    return (
        <Editor
            memo={props.memo}
            tags={tags}
            autoFocus={true}
            placeCursorAt={props.placeCursorAt}
            onSave={onSave}
            onCancel={onCancel}
            transferAttachment={transferAttachment}
            vimModeEnabled={vimModeEnabled}
        />
    )
}

const velocityThreshold = 16

function useMemoTabPanel({ memoID, isActive }: { memoID: MemoID; isActive: boolean }) {
    let ref = useRef<HTMLDivElement | null>(null)

    let closeMemo = useCallback(() => {
        requestAnimationFrame(() => {
            actions.ui.closeMemo(memoID)
        })
    }, [memoID])

    useEffect(() => {
        if (!isActive) {
            return
        }

        let el = ref.current
        if (!el) {
            return
        }

        let animTargets = document.querySelectorAll(".memo-tab-back-progress-target")
        if (!animTargets) {
            return
        }

        let isDragging = false
        let startX = -1
        let distanceThreshold = 0.4
        let durationMs = 300
        let screenWidth = -1
        let velocity = 0
        let lastPointerX = 0
        let cancelTimeout: ReturnType<typeof setTimeout> | undefined

        let animations: Animation[] = []

        let cancelAnimations = () => {
            animations.forEach((a) => a.cancel())
            animations = []
        }

        let onPointerDown = (e: PointerEvent) => {
            // if (e.pointerType !== "touch" || !e.isPrimary || e.pageX > 30) {
            if (e.pageX > 30) {
                return
            }

            ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

            e.stopImmediatePropagation()
            e.preventDefault()

            clearTimeout(cancelTimeout)
            cancelTimeout = undefined

            isDragging = true
            startX = e.pageX
            velocity = 0
            lastPointerX = 0

            screenWidth = window.visualViewport?.width ?? window.innerWidth
            let scrollTop = window.visualViewport?.pageTop ?? window.pageYOffset

            requestAnimationFrame(() => {
                document.body.style.setProperty(
                    "--dragging-memo-tab-scroll-top",
                    CSS.px(scrollTop).toString(),
                )
                document.body.classList.add("dragging-memo-tab")
            })

            cancelAnimations()

            animations = Array.from(animTargets).map((el) => {
                let a = el.animate(
                    [{ "--memo-tab-back-progress": "0" }, { "--memo-tab-back-progress": "1" }],
                    {
                        duration: durationMs,
                        easing: "linear",
                    },
                )
                a.pause()
                return a
            })

            animations.at(0)?.finished.finally(() => {
                document.body.classList.remove("dragging-memo-tab")
                document.body.style.removeProperty("--dragging-memo-tab-scroll-top")
            })
        }

        let onPointerUp = (e: PointerEvent) => {
            let progress = (e.pageX - startX) / Math.max(screenWidth, 1)

            if (isDragging) {
                if (progress <= distanceThreshold) {
                    animations.forEach((a) => a.reverse())
                } else if (velocity >= velocityThreshold) {
                    animations.forEach((a) => {
                        a.playbackRate = Math.min(5, durationMs / (screenWidth / velocity))
                        a.play()
                    })
                    animations.at(0)?.finished.finally(() => {
                        closeMemo()
                    })
                } else {
                    animations.forEach((a) => a.play())
                    animations.at(0)?.finished.finally(() => {
                        closeMemo()
                    })
                }
            }

            if (!isDragging && animations) {
                cancelAnimations()
            }

            isDragging = false
            startX = -1
            screenWidth = -1
            velocity = 0
            lastPointerX = 0

            clearTimeout(cancelTimeout)
            cancelTimeout = undefined
            ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
        }

        let onPointerCancel = (e: PointerEvent) => {
            if (!isDragging) {
                return
            }

            clearTimeout(cancelTimeout)
            cancelTimeout = setTimeout(() => {
                ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
                onPointerUp(e)
            }, 200)
        }

        let onPointerMove = (e: PointerEvent) => {
            if (!isDragging || !animations) {
                return
            }

            e.stopImmediatePropagation()
            e.preventDefault()

            let progress = (e.pageX - startX) / Math.max(screenWidth, 1)
            velocity = Math.abs(e.pageX - lastPointerX)
            lastPointerX = e.pageX

            animations.forEach((a) => {
                a.currentTime = progress * durationMs
            })

            clearTimeout(cancelTimeout)
            cancelTimeout = undefined
        }

        el.addEventListener("pointerdown", onPointerDown)
        el.addEventListener("pointermove", onPointerMove)
        el.addEventListener("pointerup", onPointerUp)
        el.addEventListener("pointercancel", onPointerCancel)

        return () => {
            cancelAnimations()
            el.removeEventListener("pointerdown", onPointerDown)
            el.removeEventListener("pointermove", onPointerMove)
            el.removeEventListener("pointerup", onPointerUp)
            el.removeEventListener("pointercancel", onPointerCancel)
        }
    }, [isActive, closeMemo])

    return { ref }
}
