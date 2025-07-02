import React, { startTransition, useCallback } from "react"

import { DEFAULT_SETTINGS, type MemoListLayouts } from "@/domain/Settings"
import { Select } from "@/ui/components/Select"
import { useT } from "@/ui/i18n"
import { useSetting } from "@/ui/settings"

export const LayoutSelect = React.memo(function LayoutSelect() {
    let t = useT("components/MemoList/LayoutSelect")

    let [listLayout, setListLayout] = useSetting("ui.memoList.layout")

    let onChange = useCallback(
        (value?: MemoListLayouts) => {
            startTransition(() => {
                setListLayout(value ?? DEFAULT_SETTINGS.ui.memoList.layout)
            })
        },
        [setListLayout],
    )

    return (
        <div className="memo-list-layout-select-positioner">
            <Select
                name="select-layout"
                label={t.Label}
                labelClassName="sr-only"
                value={listLayout}
                onChange={onChange}
                fieldClassName="memo-list-layout-select"
            >
                <Select.Option value="masonry">{t.LayoutMasonry}</Select.Option>
                <Select.Option value="single">{t.LayoutSingle}</Select.Option>
                <Select.Option value="ultra-compact">{t.LayoutUltraCompact}</Select.Option>
            </Select>
        </div>
    )
})
