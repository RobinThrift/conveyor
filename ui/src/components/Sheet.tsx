import * as Dialog from "@radix-ui/react-dialog"
import clsx from "clsx"
import React from "react"

export type SheetProps = Dialog.DialogProps
export function Sheet(props: SheetProps) {
    return <Dialog.Root {...props} />
}

export interface SheetContentProps {
    className?: string
    children: React.ReactNode | React.ReactNode[]
    title: string
    side?: "left" | "right"
}

export function SheetContent({
    children,
    side = "left",
    ...props
}: SheetContentProps) {
    return (
        <Dialog.Portal>
            <Dialog.DialogTitle>{props.title}</Dialog.DialogTitle>
            <SheetOverlay />
            <Dialog.DialogContent
                {...props}
                className={clsx(
                    "fixed z-50 gap-4 bg-background shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
                    "h-full w-3/4 xl:w-1/3 sm:max-w-xs",
                    {
                        "inset-y-0 left-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left":
                            side === "left",
                        "inset-y-0 right-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right":
                            side === "right",
                    },
                    props.className,
                )}
            >
                {children}
            </Dialog.DialogContent>
        </Dialog.Portal>
    )
}

export const SheetClose = Dialog.DialogClose

type SheetTriggerProps = Dialog.DialogTriggerProps

export function SheetTrigger(props: SheetTriggerProps) {
    return <Dialog.DialogTrigger {...props} />
}

const SheetOverlay = React.forwardRef<
    React.ElementRef<typeof Dialog.Overlay>,
    React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(function SheetOverlay({ className, ...props }, ref) {
    return (
        <Dialog.Overlay
            className={clsx(
                "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                className,
            )}
            {...props}
            ref={ref}
        />
    )
})
