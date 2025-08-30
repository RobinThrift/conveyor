import { useMemo, useState } from "react"

export function useMemoListFilterState() {
    let [collapsibileDatePickerExpaned, setCollapsibileDatePickerExpaned] = useState(false)

    return useMemo(
        () => ({
            datepicker: {
                expanded: collapsibileDatePickerExpaned,
                setExpanded: setCollapsibileDatePickerExpaned,
            },
        }),
        [collapsibileDatePickerExpaned],
    )
}
