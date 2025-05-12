import { startTransition, useCallback, useRef, useState } from "react"

import { useNavigation } from "@/ui/navigation"

export function useSettingsModalState() {
    let nav = useNavigation()

    let animRef = useRef<HTMLDivElement | null>(null)
    let startingTopOffset = useRef(0)
    let isDragging = useRef(false)
    let lastPointerY = useRef(-1)
    let velocity = useRef(0)
    let closeAnimation = useRef<Animation | undefined>(undefined)
    let [isOpen, setIsOpen] = useState(true)

    let close = useCallback(() => {
        setIsOpen(false)
        let currAnimRef = animRef.current

        let back = () =>
            startTransition(() => {
                setIsOpen(true)
                nav.popStack()
            })

        let currCloseAnimation = closeAnimation.current
        if (!currCloseAnimation && !currAnimRef) {
            back()
            return
        }

        if (currCloseAnimation) {
            currCloseAnimation.addEventListener("finish", back, { once: true })
        } else if (currAnimRef) {
            currAnimRef.addEventListener("animationend", back, { once: true })
        }
    }, [nav.popStack])

    let onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        isDragging.current = true
        lastPointerY.current = e.clientY
        ;(e.target as HTMLDivElement).setPointerCapture(e.pointerId)

        if (animRef.current) {
            let boundingRect = animRef.current.getBoundingClientRect()
            startingTopOffset.current =
                boundingRect.top + e.clientY - boundingRect.top
            animRef.current.style.transition = "none"
        }
    }, [])

    let onPointerCancel = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!isDragging.current || !animRef.current) {
                return
            }

            isDragging.current = false
            startingTopOffset.current = 0
            ;(e.target as HTMLDivElement).releasePointerCapture(e.pointerId)

            let boundingRect = animRef.current.getBoundingClientRect()
            let translateBy = e.clientY - startingTopOffset.current

            if (
                Math.abs(translateBy) > boundingRect.height * 0.5 &&
                velocity.current > 0
            ) {
                close()
            } else if (velocity.current > 27) {
                let duration = Math.min(
                    Math.abs(
                        (translateBy - boundingRect.height) / velocity.current,
                    ) * 10,
                    250,
                )
                closeAnimation.current = animRef.current.animate(
                    [
                        { transform: `translateY(${translateBy}px)` },
                        { transform: `translateY(${boundingRect.height}px)` },
                    ],
                    { duration, fill: "forwards" },
                )
                closeAnimation.current.play()
                close()
            } else {
                animRef.current.style.transition = "transform 250ms"
                animRef.current.style.transform = "translateY(0px)"
                animRef.current.style.animationDuration = "200ms"
            }
        },
        [close],
    )

    let onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging.current || !animRef.current) {
            return
        }

        velocity.current = e.clientY - lastPointerY.current
        lastPointerY.current = e.clientY

        let translateBy = e.clientY - startingTopOffset.current

        animRef.current.style.transform = `translateY(${translateBy}px)`
        animRef.current.style.animationDuration = "0"
    }, [])

    return {
        isOpen,
        animRef,
        close,
        onPointerDown,
        onPointerCancel,
        onPointerMove,
    }
}
