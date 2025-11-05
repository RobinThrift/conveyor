import clsx from "clsx"
import React from "react"

import { Alert } from "@/ui/components/Alert"
import { StackTrace } from "@/ui/devtools/StackTrace"

type PrettyErrorProps = {
    className?: string
    error: Error
}

export function PrettyError({ error, className }: PrettyErrorProps) {
    return (
        <div className={clsx("container mx-auto flex flex-col items-center", className)}>
            <Alert className="w-full">
                {error.name}: {error.message}
            </Alert>

            <StackTrace stack={error.stack} className="w-full" />
        </div>
    )
}
