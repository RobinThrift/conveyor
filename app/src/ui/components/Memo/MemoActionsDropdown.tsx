import React, { useCallback, useId } from "react"

import type { Memo } from "@/domain/Memo"
import { Button, ButtonGroup } from "@/ui/components/Button"
import { DropdownMenu } from "@/ui/components/DropdownMenu"
import { ArchiveIcon, BinIcon, DotsThreeVerticalIcon, PencilIcon } from "@/ui/components/Icons"
import { useT } from "@/ui/i18n"
import { actions } from "@/ui/stores"

export function MemoActionsDropdown({ memo }: { memo: Memo }) {
    let t = useT("components/Memo/Actions")
    let { edit, toggleArchived, toggleDeleted } = useMemoActionsDropdown(memo)

    return (
        <div className="memo-actions">
            <ButtonGroup className="memo-actions-lg">
                <Button
                    className="memo-actions-edit-btn"
                    onClick={edit}
                    iconRight={<PencilIcon />}
                    aria-label={t.Edit}
                    tooltip={t.Edit}
                />
                <Button
                    className="memo-actions-archive-btn"
                    onClick={toggleArchived}
                    iconRight={<ArchiveIcon />}
                    aria-label={memo.isArchived ? t.Unarchive : t.Archive}
                    tooltip={memo.isArchived ? t.Unarchive : t.Archive}
                />
                <Button
                    className="memo-actions-delete-btn"
                    onClick={toggleDeleted}
                    iconRight={<BinIcon />}
                    tooltip={memo.isDeleted ? t.Restore : t.Delete}
                    variant="danger"
                />
            </ButtonGroup>

            <ButtonGroup className="memo-actions-md">
                <Button
                    className="memo-actions-edit-btn"
                    onClick={edit}
                    iconRight={<PencilIcon />}
                    aria-label={t.Edit}
                    tooltip={t.Edit}
                />
                <DropdownMenu>
                    <DropdownMenu.Trigger
                        aria-label="More memo actions"
                        iconRight={<DotsThreeVerticalIcon />}
                    />
                    <DropdownMenu.Items isFixed>
                        <DropdownMenu.Item
                            id={useId()}
                            action={toggleArchived}
                            className="memo-actions-edit-btn"
                        >
                            <DropdownMenu.ItemLabel icon={<ArchiveIcon />}>
                                {memo.isArchived ? t.Unarchive : t.Archive}
                            </DropdownMenu.ItemLabel>
                        </DropdownMenu.Item>

                        <DropdownMenu.Item
                            id={useId()}
                            destructive
                            action={toggleDeleted}
                            className="memo-actions-edit-btn"
                        >
                            <DropdownMenu.ItemLabel icon={<BinIcon />}>
                                {memo.isDeleted ? t.Restore : t.Delete}
                            </DropdownMenu.ItemLabel>
                        </DropdownMenu.Item>
                    </DropdownMenu.Items>
                </DropdownMenu>
            </ButtonGroup>
            <DropdownMenu>
                <DropdownMenu.Trigger
                    aria-label="More memo actions"
                    iconRight={<DotsThreeVerticalIcon />}
                    className="memo-actions-sm"
                />
                <DropdownMenu.Items isFixed>
                    <DropdownMenu.Item id={useId()} action={edit} className="memo-actions-edit-btn">
                        <DropdownMenu.ItemLabel icon={<PencilIcon />}>
                            {t.Edit}
                        </DropdownMenu.ItemLabel>
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                        id={useId()}
                        action={toggleArchived}
                        className="memo-actions-edit-btn"
                    >
                        <DropdownMenu.ItemLabel icon={<ArchiveIcon />}>
                            {memo.isArchived ? t.Unarchive : t.Archive}
                        </DropdownMenu.ItemLabel>
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                        id={useId()}
                        destructive
                        action={toggleDeleted}
                        className="memo-actions-edit-btn"
                    >
                        <DropdownMenu.ItemLabel icon={<BinIcon />}>
                            {memo.isDeleted ? t.Restore : t.Delete}
                        </DropdownMenu.ItemLabel>
                    </DropdownMenu.Item>
                </DropdownMenu.Items>
            </DropdownMenu>
        </div>
    )
}

function useMemoActionsDropdown(memo: Memo) {
    return {
        edit: useCallback(() => {
            actions.memos.startEdit(memo.id, findStartEditPosition())
            actions.ui.openMemo(memo.id)
        }, [memo.id]),

        toggleArchived: useCallback(() => {
            actions.memos.setArchiveStatus(memo.id, !memo.isArchived)
        }, [memo.id, memo.isArchived]),

        toggleDeleted: useCallback(() => {
            if (memo.isDeleted) {
                actions.memos.undelete(memo.id)
            } else {
                actions.memos.delete(memo.id)
            }
        }, [memo.id, memo.isDeleted]),
    }
}

function findStartEditPosition() {
    let viewport = {
        width: window.visualViewport?.width ?? window.screen.width,
        pageTop: window.visualViewport?.pageTop ?? window.scrollY,
    }

    let memoBoundingBox = document
        .querySelector(`.memo-tab-panel[aria-hidden="false"] .memo-tab-panel-memo`)
        ?.getBoundingClientRect()

    let posX = memoBoundingBox ? memoBoundingBox.x + memoBoundingBox.width / 2 : viewport.width / 2
    let posY = 10

    let caret = document.caretPositionFromPoint(posX, posY)

    if (!caret) {
        return {
            pageTop: viewport.pageTop,
        }
    }

    let pos = findParentPos(caret.offsetNode.parentElement)

    let snippet = caret.offsetNode.textContent

    return {
        pageTop: viewport.pageTop,
        snippet: snippet?.split("\n")[0].trim(),
        pos: typeof pos !== "undefined" ? pos + caret.offset : undefined,
    }
}

function findParentPos(el?: HTMLElement | null): number | undefined {
    if (el?.classList.contains("memo-content") || el?.classList.contains("memo-tab-panel-memo")) {
        return
    }

    if (!el) {
        return
    }

    let pos = el.dataset.pos
    if (!pos) {
        return findParentPos(el.parentElement)
    }

    try {
        return Number.parseInt(pos, 10)
    } catch {
        return
    }
}
