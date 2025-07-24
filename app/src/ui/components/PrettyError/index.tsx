import React from "react"

export type PrettyErrorProps = {
    className?: string
    error: Error
}

export const PrettyError = React.lazy<React.ComponentType<PrettyErrorProps>>(() =>
    import(`./PrettyError.${import.meta.env.DEV ? "dev" : "prod"}.tsx`).then(({ PrettyError }) => ({
        default: PrettyError,
    })),
)
