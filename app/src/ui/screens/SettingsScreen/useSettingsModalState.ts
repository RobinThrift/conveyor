import { useCallback, useState } from "react"

import { useNavigation } from "@/ui/navigation"

export function useSettingsModalState() {
    let [isOpen, setIsOpen] = useState(true)
    let nav = useNavigation()

    let onClose = useCallback(() => {
        setIsOpen(false)
        nav.pop()
    }, [nav.pop])

    return {
        isOpen,
        onClose,
    }
}
