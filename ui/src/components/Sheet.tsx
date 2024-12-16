import * as Dialog from "@radix-ui/react-dialog"
import clsx from "clsx"
import React from "react"

export type SheetProps = Dialog.DialogProps
export function Sheet(props: SheetProps) {
    return <Dialog.Root {...props} />
}

export interface SheetContentProps {
    className?: string
    titleClassName?: string
    children: React.ReactNode | React.ReactNode[]
    title: string
    description?: string
    side?: "left" | "right"
}

export function SheetContent({
    children,
    side = "left",
    titleClassName,
    description,
    title,
    ...props
}: SheetContentProps) {
    return (
        <Dialog.Portal>
            <Dialog.DialogTitle className={titleClassName}>
                {title}
            </Dialog.DialogTitle>
            <Dialog.DialogDescription className="sr-only">
                {description}
            </Dialog.DialogDescription>
            <SheetOverlay />
            <Dialog.DialogContent
                {...props}
                className={clsx(
                    "fixed z-[1001] gap-4 bg-background shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
                    "h-full w-3/4 xs:w-1/3",
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

export const SheetOverlay = React.forwardRef<
    React.ElementRef<typeof Dialog.Overlay>,
    React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(function SheetOverlay({ className, ...props }, ref) {
    return (
        <Dialog.Overlay
            className={clsx(
                "fixed inset-0 z-[1000] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                className,
            )}
            {...props}
            style={{ viewTransitionName: "overlay" }}
            ref={ref}
        />
    )
})
