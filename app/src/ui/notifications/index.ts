import type { ButtonProps } from "@/ui/components/Button"

export interface Notification {
    type: "info" | "error"
    title: string
    message?: string
    buttons?: Omit<ButtonProps, "ref">[]
    durationMs?: number
    requiresAction?: boolean
}
