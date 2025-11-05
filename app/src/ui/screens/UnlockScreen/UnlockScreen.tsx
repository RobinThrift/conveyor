import React, { useCallback } from "react"

import type { PlaintextPrivateKey } from "@/lib/crypto"
import { Alert } from "@/ui/components/Alert"
import { Button } from "@/ui/components/Button"
import { Form } from "@/ui/components/Form"
import { PasswordIcon } from "@/ui/components/Icons"
import { Input } from "@/ui/components/Input"
import { useT } from "@/ui/i18n"

import { Lock } from "./Lock"
import { StoreUnlockKeyCheckbox } from "./StoreUnlockKeyCheckbox"
import { useUnlockScreenState } from "./useUnlockScreenState"

export function UnlockScreen() {
    let t = useT("screens/Unlock")

    let { unlock, isDisabled, unlockState, error } = useUnlockScreenState()

    let onSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault()
            e.preventDefault()
            e.stopPropagation()

            let target = e.target as HTMLFormElement
            let formData = new FormData(target)

            let plaintextPrivateKey = formData.get("password")

            if (plaintextPrivateKey) {
                unlock({
                    plaintextKeyData: plaintextPrivateKey as PlaintextPrivateKey,
                    storeKey: formData.get("store_key") === "on",
                })
            }
        },
        [unlock],
    )

    return (
        <div className="unlock-screen">
            <Lock unlockState={unlockState} />

            <div className="unlock-form">
                <Form action="#" onSubmit={onSubmit} className="p-4 space-y-4">
                    <Input
                        name="password"
                        icon={<PasswordIcon />}
                        label={t.PrivateKeyLabel}
                        type="password"
                        autoComplete="password"
                        required={true}
                        placeholder={t.PrivateKeyLabel}
                        messages={t}
                        disabled={isDisabled}
                    />

                    <StoreUnlockKeyCheckbox isDisabled={isDisabled} />

                    {error && (
                        <Alert>
                            {error.name}: {error.message}
                            {error.stack && (
                                <pre>
                                    <code>{error.stack}</code>
                                </pre>
                            )}
                        </Alert>
                    )}

                    <div className="flex items-center justify-end mt-4">
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={isDisabled}
                        >
                            {t.UnlockButton}
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    )
}
