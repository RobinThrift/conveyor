import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"

import { usePreventScroll } from "@/ui/hooks/usePreventScroll"

import type { AlertDialogContext } from "./context"

export function useAlertDialog(props: {
    open?: boolean
    children: React.ReactNode | React.ReactNode[]
    onClose?: () => void
}) {
    let ref = useRef<HTMLDialogElement | null>(null)
    let labelledByID = useId()
    let describedByID = useId()
    let [isOpen, setIsOpen] = useState(false)

    usePreventScroll({ isDisabled: !isOpen })

    let open = useCallback(() => {
        if (isOpen) {
            return
        }

        ref.current?.showModal()
        setIsOpen(true)
    }, [isOpen])

    let close = useCallback(() => {
        if (!isOpen) {
            return
        }

        let dialog = ref.current
        if (!dialog) {
            return
        }

        dialog.close()
        setIsOpen(false)
    }, [isOpen])

    useEffect(() => {
        if (typeof props.open === "undefined") {
            return
        }

        if (props.open && !ref.current?.open) {
            open()
            return
        }

        if (!props.open && ref.current?.open) {
            close()
        }
    }, [props.open, open, close])

    let ctx = useMemo(
        () =>
            ({
                ref,
                isOpen,
                labelledByID,
                describedByID,
                open,
                close,
            }) satisfies AlertDialogContext,
        [open, close, isOpen, labelledByID, describedByID],
    )

    useEffect(() => {
        let onkeydown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault()
            }
        }

        ref.current?.addEventListener("keydown", onkeydown)

        return () => {
            ref.current?.removeEventListener("keydown", onkeydown)
        }
    }, [])

    useEffect(() => {
        let onclose = props.onClose
        if (!onclose) {
            return
        }

        ref.current?.addEventListener("close", onclose)
        return () => {
            ref.current?.removeEventListener("close", onclose)
        }
    }, [props.onClose])

    return ctx
}
