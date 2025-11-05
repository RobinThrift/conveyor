import React from "react"

import { Alert } from "@/ui/components/Alert"

type PrettyErrorProps = {
    className?: string
    error: Error
}

export function PrettyError({ className, error }: PrettyErrorProps) {
    return (
        <Alert className={className}>
            {error.name}: {error.message}
            {error.stack && (
                <pre>
                    <code>{error.stack}</code>
                </pre>
            )}
        </Alert>
    )
}
