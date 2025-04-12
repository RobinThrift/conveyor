import React, { useCallback, useState } from "react"

import type { PrivateCryptoKey } from "@/lib/crypto"
import type { AsyncResult, Result } from "@/lib/result"
import { Alert } from "@/ui/components/Alert"
import { BuildInfo } from "@/ui/components/BuildInfo"
import { Button } from "@/ui/components/Button"
import { ConveyorBeltText } from "@/ui/components/ConveyorBeltText/ConveyorBeltText"
import { Form } from "@/ui/components/Form"
import { Input } from "@/ui/components/Input"
import { RadioGroup, RadioItem } from "@/ui/components/Radio"
import { useStateGetter } from "@/ui/hooks/useStateGetter"
import { useT } from "@/ui/i18n"
import type { SyncMethod } from "@/ui/state"

import { AuthForm } from "@/ui/components/AuthForm"
import { Loader } from "@/ui/components/Loader"
import {
    useInitSetupScreenState,
    useStepConfigureRemoteSyncState,
} from "./useInitSetupScreenState"

export function InitSetupScreen() {
    let t = useT("screens/InitSetup")
    let {
        step,
        next,
        isNew,
        back,
        startNew,
        startFromRemote,
        generatePrivateCryptoKey,
        importPrivateCryptoKey,
        checkPrivateCryptoKey,
        syncMethod,
        setSyncMethod,
        error,
    } = useInitSetupScreenState()

    let stepComp: React.ReactNode
    switch (step) {
        case "initial-setup":
            stepComp = (
                <StepChooseStart
                    startNew={startNew}
                    startFromRemote={startFromRemote}
                />
            )
            break
        case "choose-sync-method":
            stepComp = (
                <StepChooseSyncMethod
                    next={next}
                    back={back}
                    syncMethod={syncMethod}
                    setSyncMethod={setSyncMethod}
                />
            )
            break
        case "configure-remote-sync":
        case "remote-error":
            stepComp = (
                <StepConfigureRemoteSync
                    next={next}
                    error={error}
                    back={back}
                />
            )
            break
        case "configure-encryption":
            stepComp = (
                <StepConfigureEncryption
                    back={back}
                    isNew={isNew}
                    generatePrivateCryptoKey={generatePrivateCryptoKey}
                    importPrivateCryptoKey={importPrivateCryptoKey}
                    checkPrivateCryptoKey={checkPrivateCryptoKey}
                    error={error}
                />
            )
            break
        case "sync":
        case "start-sync":
        case "sync-error":
            stepComp = <StepSyncing error={error} back={back} />
            break
    }

    return (
        <div className="init-setup-screen">
            <div className="unlock-page-bg" aria-hidden>
                <div className="spot-3" />
                <div className="spot-2" />
                <div className="spot-1" />
                <div className="noise" />
            </div>

            <ConveyorBeltText
                className="logo"
                start="Co"
                middle="n"
                end="veyor"
                aria-hidden
            />

            <div className="setup-window">
                <div className="setup-window-content">
                    <h1>{t.Title}</h1>

                    <div>{stepComp}</div>
                </div>
            </div>

            <footer className="init-setup-screen-footer">
                <BuildInfo />
            </footer>
        </div>
    )
}

function StepChooseStart({
    startNew,
    startFromRemote,
}: {
    startNew: () => void
    startFromRemote: () => void
}) {
    let t = useT("screens/InitSetup")
    return (
        <div className="flex flex-col gap-2">
            <Button variant="primary" onPress={startNew} size="lg">
                {t.NewButtonLabel}
            </Button>

            <Button variant="primary" onPress={startFromRemote} size="lg">
                {t.FromRemoteButtonLabel}
            </Button>
        </div>
    )
}

function StepChooseSyncMethod({
    syncMethod,
    setSyncMethod,
    next,
    back,
}: {
    syncMethod: SyncMethod
    setSyncMethod: (m: SyncMethod) => void
    next: () => void
    back: () => void
}) {
    let t = useT("screens/InitSetup")

    let onValueChange = useCallback(
        (value: unknown) => {
            setSyncMethod(value as SyncMethod)
        },
        [setSyncMethod],
    )

    return (
        <div className="space-y-2">
            <h4>{t.SelectSyncMethodTitle}</h4>
            <RadioGroup value={syncMethod} onValueChange={onValueChange}>
                <RadioItem label={t.SyncMethodLocalOnly} value="local-only" />
                <RadioItem label={t.SyncMethodRemoteSync} value="remote-sync" />
            </RadioGroup>

            <div className="flex gap-2 justify-between">
                <Button variant="primary" onPress={back}>
                    {t.BackButtonLabel}
                </Button>

                <Button variant="primary" onPress={next} size="lg">
                    {t.NextButtonLabel}
                </Button>
            </div>
        </div>
    )
}

function StepConfigureRemoteSync({
    next,
    back,
    error,
}: {
    next: () => void
    back: () => void
    error?: Error
}) {
    let t = useT("screens/InitSetup")

    let { authStatus, login, changePassword, authError } =
        useStepConfigureRemoteSyncState({ next })

    return (
        <div className="space-y-4">
            <AuthForm
                status={authStatus}
                login={login}
                changePassword={changePassword}
                error={authError}
            />

            {error && (
                <Alert variant="danger">
                    {error.name}: {error.message}
                    {error.stack && (
                        <pre>
                            <code>{error.stack}</code>
                        </pre>
                    )}
                </Alert>
            )}

            <Button variant="primary" onPress={back}>
                {t.BackButtonLabel}
            </Button>
        </div>
    )
}

function StepConfigureEncryption({
    generatePrivateCryptoKey,
    importPrivateCryptoKey,
    checkPrivateCryptoKey,
    isNew,
    back,
    error,
}: {
    generatePrivateCryptoKey: () => AsyncResult<string>
    candidatePrivateCryptoKey?: PrivateCryptoKey
    importPrivateCryptoKey: (key: string) => void
    checkPrivateCryptoKey: (key: string) => Result<void>
    isNew: boolean
    error?: Error
    back: () => void
}) {
    let t = useT("screens/InitSetup")

    let [value, setValue] = useStateGetter("")
    let [genError, setGnError] = useState<Error | undefined>(undefined)

    let onChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setValue(e.target.value)
        },
        [setValue],
    )

    let generate = useCallback(() => {
        generatePrivateCryptoKey().then((key) => {
            if (!key.ok) {
                setGnError(key.err)
                return
            }

            setValue(key.value)
        })
    }, [generatePrivateCryptoKey, setValue])

    let onSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault()

            let checked = checkPrivateCryptoKey(value())
            if (!checked.ok) {
                setGnError(checked.err)
                return
            }

            importPrivateCryptoKey(value())
        },
        [checkPrivateCryptoKey, importPrivateCryptoKey, value],
    )

    let onClickBack = useCallback(() => {
        back()
    }, [back])

    return (
        <Form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <h4>{t.ConfigureEncryptionTitle}</h4>

            <Input
                label={t.CandidatePrivateCryptoKeyLabel}
                value={value()}
                onChange={onChange}
                name="candidatePrivateCryptoKey"
                autoComplete="off"
            />

            {isNew && (
                <Button variant="primary" onPress={generate}>
                    {t.GenerateCandidatePrivateCryptoKeyLabel}
                </Button>
            )}

            <div className="flex gap-2 justify-between">
                <Button variant="primary" onPress={onClickBack}>
                    {t.BackButtonLabel}
                </Button>

                <Button
                    variant="primary"
                    type="submit"
                    isDisabled={value().length === 0}
                >
                    {t.NextButtonLabel}
                </Button>
            </div>

            {genError && (
                <Alert variant="danger">
                    {genError.name}: {genError.message}
                    {genError.stack && (
                        <pre>
                            <code>{genError.stack}</code>
                        </pre>
                    )}
                </Alert>
            )}

            {error && (
                <Alert variant="danger">
                    {error.name}: {error.message}
                    {error.stack && (
                        <pre>
                            <code>{error.stack}</code>
                        </pre>
                    )}
                </Alert>
            )}
        </Form>
    )
}

function StepSyncing({
    error,
    back,
}: {
    error?: Error
    back: () => void
}) {
    let t = useT("screens/InitSetup")

    return (
        <div className="min-h-[100px]">
            {error ? (
                <>
                    <Alert variant="danger">
                        {error.name}: {error.message}
                        {error.stack && (
                            <pre>
                                <code>{error.stack}</code>
                            </pre>
                        )}
                    </Alert>

                    <Button variant="primary" onPress={back}>
                        {t.BackButtonLabel}
                    </Button>
                </>
            ) : (
                <Loader />
            )}
        </div>
    )
}
