import clsx from "clsx"
import React, { Suspense } from "react"

import type { Screens } from "@/control/NavigationController"
import { ErrorBoundary } from "@/ui/components/ErrorBoundary"
import { EditMemoScreen } from "@/ui/screens/EditMemoScreen"
import { MemoListScreen } from "@/ui/screens/MemoListScreen"
import { SingleMemoScreen } from "@/ui/screens/SingleMemoScreen"

export interface MainScreenProps<S extends keyof Screens> {
    activeScreen: S
}

export function MainScreen<S extends keyof Screens>(props: MainScreenProps<S>) {
    let subscreen: React.ReactNode | null = null
    switch (props.activeScreen) {
        case "memo.view":
            subscreen = <SingleMemoScreen className="is-subscreen" />
            break
        case "memo.edit":
            subscreen = <EditMemoScreen className="is-subscreen" />
            break
        case "memo.new":
            subscreen = <EditMemoScreen className="is-subscreen" />
            break
    }

    return (
        <div
            className={clsx("main-screen", {
                "has-subscreen": subscreen !== null,
            })}
        >
            {subscreen && (
                <ErrorBoundary resetOn={[props.activeScreen]}>
                    <Suspense>
                        <div className="subscreen">{subscreen}</div>
                    </Suspense>
                </ErrorBoundary>
            )}

            <MemoListScreen className="is-subscreen" />
        </div>
    )
}
