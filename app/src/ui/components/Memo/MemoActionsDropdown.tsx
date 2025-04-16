import React from "react"

import type { Memo } from "@/domain/Memo"
import { Button } from "@/ui/components/Button"
import { DropdownMenu } from "@/ui/components/DropdownMenu"
import {
    ArchiveIcon,
    BinIcon,
    DotsThreeVerticalIcon,
    PencilIcon,
} from "@/ui/components/Icons"
import { useT } from "@/ui/i18n"
import type { MemoActions } from "./MemoActions"

export function MemoActionsDropdown({
    memo,
    actions,
}: {
    memo: Memo
    actions?: Partial<MemoActions>
}) {
    let t = useT("components/Memo/Actions")

    return (
        <div className="memo-actions not-prose">
            {actions?.edit && (
                <Button
                    iconLeft={<PencilIcon />}
                    plain={true}
                    size="sm"
                    onPress={() => actions?.edit?.(memo.id)}
                />
            )}

            {((actions?.delete ?? true) || (actions?.archive ?? true)) && (
                <DropdownMenu>
                    <DropdownMenu.Trigger
                        ariaLabel="More memo actions"
                        iconRight={<DotsThreeVerticalIcon weight="bold" />}
                        size="sm"
                        plain
                    />
                    <DropdownMenu.Items>
                        {actions?.archive && (
                            <DropdownMenu.Item
                                action={() =>
                                    actions?.archive?.(
                                        memo.id,
                                        !memo.isArchived,
                                    )
                                }
                            >
                                <DropdownMenu.ItemLabel icon={<ArchiveIcon />}>
                                    {memo.isArchived ? t.Unarchive : t.Archive}
                                </DropdownMenu.ItemLabel>
                            </DropdownMenu.Item>
                        )}

                        {actions?.delete && (
                            <DropdownMenu.Item
                                destructive
                                action={() =>
                                    actions?.delete?.(memo.id, !memo.isDeleted)
                                }
                            >
                                <DropdownMenu.ItemLabel icon={<BinIcon />}>
                                    {memo.isDeleted ? t.Restore : t.Delete}
                                </DropdownMenu.ItemLabel>
                            </DropdownMenu.Item>
                        )}
                    </DropdownMenu.Items>
                </DropdownMenu>
            )}
        </div>
    )
}
