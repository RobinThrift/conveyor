import type { ButtonProps } from "@/components/Button"

export interface Notification {
    type: "info" | "error"
    title: string
    message?: string
    buttons?: (ButtonProps & { ariaLabel: string })[]
    durationMs?: number
    requiresAction?: boolean
}
