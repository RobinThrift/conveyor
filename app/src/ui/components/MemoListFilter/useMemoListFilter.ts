import { startTransition, useCallback, useState } from "react"

import { useIsMobile } from "@/ui/hooks/useIsMobile"

export function useMemoListFilter() {
    let isTagTreeSidebar = useIsMobile()
    let [showTagTreeSidebar, setShowTagTreeSidebar] = useState(false)

    let onClickShowTagTreeSidebarBtn = useCallback(
        () => startTransition(() => setShowTagTreeSidebar(true)),
        [],
    )
    let hideTagTreeSidebar = useCallback(
        () => startTransition(() => setShowTagTreeSidebar(false)),
        [],
    )

    return {
        isTagTreeSidebar,
        onClickShowTagTreeSidebarBtn,
        showTagTreeSidebar,
        hideTagTreeSidebar,
    }
}
