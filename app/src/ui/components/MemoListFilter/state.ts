import { useMemo, useState } from "react"

export function useMemoListFilterState() {
    let [collapsibileDatePickerExpaned, setCollapsibileDatePickerExpaned] = useState(false)

    // let onChangeSearch = useCallback((query: string) => {
    //     actions.memos.list.setFilter(
    //         query,
    //         "user",
    //     )
    // }, [])
    //
    // let onSelectDate = useCallback((date: CalendarDate | undefined) => {
    //     actions.memos.list.setFilter({
    //         filter: { exactDate: date },
    //         source: "user",
    //     })
    // }, [])
    //
    // let onSelectStateFilter = useCallback((state?: "isArchived" | "isDeleted") => {
    //     switch (state) {
    //         case "isArchived":
    //             actions.memos.list.setFilter({
    //                 filter: { isArchived: true },
    //                 source: "user",
    //             })
    //             return
    //         case "isDeleted":
    //             actions.memos.list.setFilter({
    //                 filter: { isDeleted: true },
    //                 source: "user",
    //             })
    //             return
    //     }
    //
    //     actions.memos.list.setFilter({
    //         filter: { isDeleted: undefined, isArchived: undefined },
    //         source: "user",
    //     })
    // }, [])

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
