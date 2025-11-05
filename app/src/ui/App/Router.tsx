import React, { Suspense, startTransition, useEffect, useRef, useState } from "react"

import type { Stacks } from "@/control/NavigationController"
import { useCurrentScreen } from "@/ui/navigation"
import { ErrorScreen } from "@/ui/screens/ErrorScreen"
import { InitSetupScreen } from "@/ui/screens/InitSetupScreen"
import { ListScreen } from "@/ui/screens/ListScreen"
import { MemoScreen } from "@/ui/screens/MemoScreen"
import { SettingsScreen } from "@/ui/screens/SettingsScreen"
import { UnlockScreen } from "@/ui/screens/UnlockScreen"

export function Router() {
    let currentScreen = useCurrentScreen()
    let [stacks, setStacks] = useState<Partial<Record<Stacks, React.ReactNode>>>({})

    let [components, setComponents] = useState<React.ReactNode[]>([])

    let showingScreen = useRef<string | undefined>(undefined)

    // biome-ignore lint/correctness/useExhaustiveDependencies: omitted to prevent unnecessary re-evaluations
    useEffect(() => {
        if (showingScreen.current === currentScreen?.screen) {
            return
        }

        showingScreen.current = currentScreen?.screen

        if (!currentScreen || !currentScreen.stack) {
            setComponents([])
            return
        }

        let nextComp: React.ReactElement | undefined
        switch (currentScreen.screen) {
            case "list":
                nextComp = (
                    <Suspense key="main-stack-suspense">
                        <ListScreen key="main-stack" />
                    </Suspense>
                )
                break
            case "memos":
                nextComp = (
                    <Suspense key="memos-stack-suspense">
                        <MemoScreen key="memos-stack" />
                    </Suspense>
                )
                break
            case "unlock":
                nextComp = (
                    <Suspense key="main-stack-suspense">
                        <UnlockScreen key="main-stack" />
                    </Suspense>
                )
                break

            case "setup":
                nextComp = (
                    <Suspense key="main-stack-suspense">
                        <InitSetupScreen key="main-stack" />
                    </Suspense>
                )
                break
            case "settings":
                nextComp = (
                    <Suspense key="settings-stack-suspense">
                        <SettingsScreen key="settings-stack" />
                    </Suspense>
                )
                break
        }

        startTransition(() => {
            let nextStacks: typeof stacks = {
                ...stacks,
                [currentScreen.stack]: nextComp,
            }

            if (!("main" in nextStacks)) {
                nextStacks.main = (
                    <Suspense key="main-stack-suspense">
                        <ListScreen key="main-stack" />
                    </Suspense>
                )
            }

            if ("settings" in nextStacks && currentScreen.stack !== "settings") {
                delete nextStacks.settings
            }

            setStacks(nextStacks)
            setComponents(Object.entries(nextStacks).map(([, comp]) => comp))
        })
    }, [currentScreen?.screen, currentScreen?.stack])

    if (components.length === 0) {
        return (
            <div className="screens">
                <Suspense>
                    <ErrorScreen
                        title="Page Not Found"
                        code={404}
                        detail="The requested screen could not be found"
                    />
                </Suspense>
            </div>
        )
    }

    return (
        <div className="screens" data-active-stack={currentScreen?.stack}>
            {components}
        </div>
    )
}
