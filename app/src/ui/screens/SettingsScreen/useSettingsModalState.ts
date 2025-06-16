import { useCallback, useState } from "react"

import { useNavigation } from "@/ui/navigation"

export function useSettingsModalState() {
    let nav = useNavigation()
    let [isOpen, setIsOpen] = useState(true)

    let onClose = useCallback(() => {
        setIsOpen(false)
        nav.popStack()
    }, [nav.popStack])

    return {
        isOpen,
        onClose,
    }
}
