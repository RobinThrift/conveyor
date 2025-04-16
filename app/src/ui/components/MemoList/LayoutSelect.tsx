import React from "react"

import { ListIcon, TableIcon } from "@/ui/components/Icons"
import { Select } from "@/ui/components/Select"
import { useT } from "@/ui/i18n"
import { useSetting } from "@/ui/settings"

export function LayoutSelect() {
    let t = useT("components/MemoList/LayoutSelect")

    let [listLayout, setListLayout] = useSetting("ui.memoList.layout")

    return (
        <div className="memo-list-layout-select-positioner">
            <Select
                name="select-layout"
                label={t.Label}
                labelClassName="sr-only"
                value={listLayout}
                onChange={setListLayout}
                className="memo-list-layout-select"
            >
                <Select.Option value="masonry">
                    <div className="flex gap-1 items-center">
                        <ListIcon />
                        <span className="option-label">{t.LayoutMasonry}</span>
                    </div>
                </Select.Option>
                <Select.Option value="single">
                    <div className="flex gap-1 items-center">
                        <TableIcon />
                        <span className="option-label">{t.LayoutSingle}</span>
                    </div>
                </Select.Option>
                <Select.Option value="ultra-compact">
                    <div className="flex gap-1 items-center">
                        <TableIcon />
                        <span className="option-label">
                            {t.LayoutUltraCompact}
                        </span>
                    </div>
                </Select.Option>
            </Select>
        </div>
    )
}
