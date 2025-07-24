import type { Decorator } from "@storybook/react-vite"
import React from "react"

import { usePromise } from "@/ui/hooks/usePromise"

import { type InitOpts, init } from "./init"

export const withMockBackend =
    (opts: InitOpts): Decorator =>
    (Story) => {
        let initialized = usePromise(() => init(opts))

        if (!initialized.resolved) {
            return <div />
        }

        if (initialized.error) {
            console.error(initialized.error)
        }

        return <Story />
    }
