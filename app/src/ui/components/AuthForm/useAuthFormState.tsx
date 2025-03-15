import type { PlaintextPassword } from "@/auth/credentials"
import { type AuthStatus, actions } from "@/ui/state"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useDispatch } from "react-redux"

import type { ChangePasswordArgs } from "./ChangePasswordForm"

export interface UseAuthFormStateProps {
    login: (args: LoginArgs) => void
    changePassword: (args: ChangePasswordArgs) => void
    status: AuthStatus
    error?: Error
}

export interface LoginArgs {
    server: string
    username: string
    password: PlaintextPassword
}

export function useAuthFormState(props: UseAuthFormStateProps) {
    let dispatch = useDispatch()
    let [username, setUsername] = useState<string>("")
    let [requestFired, setRequestFired] = useState(false)
    let isLoading = useMemo(
        () =>
            props.status === "authenticating" ||
            props.status === "password-change-in-progress",
        [props.status],
    )
    let showChangePasswordDialog = useMemo(
        () =>
            (props.status === "password-change-required" ||
                props.status === "password-change-in-progress" ||
                props.status === "password-change-error") &&
            requestFired,
        [props.status, requestFired],
    )

    let cancelPasswordChangeDialog = useCallback(() => {
        dispatch(
            actions.auth.setAuthStatus({
                status: "not-authenticated",
            }),
        )
    }, [dispatch])

    useEffect(() => {
        if (props.status === "authenticated") {
            setRequestFired(false)
        }
    }, [props.status])

    let onSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            e.stopPropagation()

            let target = e.target as HTMLFormElement

            let server = target.querySelector("#server") as HTMLInputElement
            let username = target.querySelector("#username") as HTMLInputElement
            let password = target.querySelector("#password") as HTMLInputElement

            setUsername(username.value)
            setRequestFired(true)

            props.login({
                server:
                    server.value ||
                    `${globalThis.location.protocol}//${globalThis.location.host}`,
                username: username.value,
                password: password.value as PlaintextPassword,
            })
        },
        [props.login],
    )

    return {
        username,
        showChangePasswordDialog,
        cancelPasswordChangeDialog,
        isLoading,
        onSubmit,
    }
}
