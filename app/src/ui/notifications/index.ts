import type { ButtonProps } from "@/ui/components/Button"

export interface Notification {
    type: "info" | "error"
    title: string
    message?: string
    buttons?: (ButtonProps & { ariaLabel: string })[]
    durationMs?: number
    requiresAction?: boolean
}
