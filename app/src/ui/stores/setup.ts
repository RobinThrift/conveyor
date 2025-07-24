import type { BackendClient } from "@/backend/BackendClient"
import { BUILD_INFO } from "@/buildInfo"
import type { PlaintextPrivateKey } from "@/lib/crypto"
import { type KeyPaths, type ValueAt, setPath } from "@/lib/getset"
import { batch, createActions, createEffect, createStore } from "@/lib/store"

import * as auth from "./auth"
import * as settings from "./settings"
import * as sync from "./sync"
import * as unlock from "./unlock"

export type SetupStep =
    | "unknown"
    | "initial-setup"
    | "choose-sync-method"
    | "configure-remote-sync"
    | "testing-remote-sync"
    | "configure-encryption"
    | "start-sync"
    | "sync"
    | "done"
    | "remote-error"
    | "sync-error"
    | "unknown-error"
    | "load-error"

export type SyncMethod = "local-only" | "remote-sync"

export const isSetup = createStore<boolean>("setup/isSetup", false)

export const step = createStore<SetupStep>("setup/step", "unknown")

type SetupOptions = {
    isNew: boolean
    syncMethod: SyncMethod
    candidatePrivateCryptoKey?: PlaintextPrivateKey
}

export const selectedOptions = createStore<SetupOptions>("setup/selectedOptions", {
    isNew: false,
    syncMethod: "local-only",
})

export const error = createStore<Error | undefined>("setup/error", undefined)

export const actions = createActions({
    startNew: () => {
        batch(() => {
            selectedOptions.setState({
                isNew: true,
                syncMethod: "local-only",
            })
            step.setState("configure-encryption")
            error.setState(undefined)
        })
    },

    startFromRemote: () => {
        batch(() => {
            selectedOptions.setState({
                isNew: false,
                syncMethod: "remote-sync",
            })
            step.setState("configure-encryption")
            error.setState(undefined)
        })
    },

    setStep: (next: SetupStep) => {
        batch(() => {
            step.setState(next)
            error.setState(undefined)
        })
    },

    next: () => {
        switch (step.state) {
            case "configure-encryption":
                if (selectedOptions.state.isNew) {
                    step.setState("choose-sync-method")
                } else {
                    step.setState("configure-remote-sync")
                }
                break
            case "choose-sync-method":
                if (selectedOptions.state.syncMethod === "remote-sync") {
                    step.setState("configure-remote-sync")
                } else {
                    step.setState("done")
                }
                break
            case "configure-remote-sync":
                if (selectedOptions.state.isNew) {
                    step.setState("done")
                } else {
                    step.setState("start-sync")
                }
                break
            case "start-sync":
                step.setState("sync")
                break
            case "sync":
                step.setState("done")
                break
            case "remote-error":
                step.setState("configure-remote-sync")
                break
            case "sync-error":
                step.setState("configure-encryption")
                break
        }
    },

    setSetupOption: <K extends KeyPaths<SetupOptions>>(key: K, value: ValueAt<SetupOptions, K>) => {
        selectedOptions.setState(setPath(selectedOptions.state, key, value))
    },

    setupCandidatePrivateCryptoKey: (plaintextKeyData: PlaintextPrivateKey) => {
        selectedOptions.setState((prev) => ({
            ...prev,
            candidatePrivateCryptoKey: plaintextKeyData,
        }))

        if (selectedOptions.state.isNew) {
            step.setState("choose-sync-method")
        } else {
            step.setState("configure-remote-sync")
        }
    },
})

export const selectors = {
    isNew: (s: typeof selectedOptions.state) => s.isNew,
}

export function registerEffects(backend: BackendClient) {
    let unmounts: {
        setupCandidatePrivateCryptoKeyEffect?: () => void
        syncEffect?: () => void
        authEffect?: () => void
    } = {}

    let [setupCandidatePrivateCryptoKeyEffect] = createEffect(
        "setup/setupCandidatePrivateCryptoKey",
        {
            fn: async (ctx, { batch }) => {
                let { candidatePrivateCryptoKey } = selectedOptions.state
                if (!candidatePrivateCryptoKey) {
                    return
                }

                let [_, err] = await backend.crypto.init(ctx, {
                    plaintextKeyData: candidatePrivateCryptoKey,
                })
                if (err) {
                    batch(() => _actions.setErrorAndGoToStep("configure-encryption", err))
                }

                batch(() => {
                    auth.actions.reset()
                    sync.actions.reset()
                })
            },
            autoMount: false,
            deps: [selectedOptions],
            precondition: () => step.state === "configure-encryption",
            eager: false,
        },
    )

    let [syncEffect] = createEffect("setup/sync", {
        fn: async () => {
            if (isSetup.state) {
                return
            }

            if (step.state === "sync-error" || step.state === "remote-error") {
                actions.next()
                return
            }

            if (step.state !== "sync") {
                return
            }

            if (sync.status.state === "error") {
                batch(() => {
                    step.setState("sync-error")
                    error.setState(sync.error.state)
                })
                return
            }

            if (sync.status.state === "ready") {
                actions.next()
            }
        },
        autoMount: false,
        deps: [sync.status],
        eager: false,
    })

    let [authEffect] = createEffect("setup/auth", {
        fn: async () => {
            if (isSetup.state) {
                return
            }

            if (auth.status.state !== "error") {
                return
            }

            batch(() => {
                step.setState("remote-error")
                error.setState(auth.error.state)
            })
        },
        autoMount: false,
        deps: [auth.status],
        eager: false,
    })

    let [, unmountStepEffect] = createEffect("setup/step", {
        fn: (ctx, { batch }) => {
            if (step.state === "done") {
                unmountStepEffect()

                if (isSetup.state) {
                    return
                }

                let plaintextKeyData = selectedOptions.state.candidatePrivateCryptoKey

                if (!plaintextKeyData) {
                    batch(() =>
                        _actions.setErrorAndGoToStep(
                            "configure-encryption",
                            new Error(
                                "somehow got to the end of the setup without setting up an encryption key",
                            ),
                        ),
                    )
                    return
                }

                isSetup.setState(true)
                for (let unmount of Object.values(unmounts)) {
                    unmount()
                }
                unmounts = {}

                batch(() => {
                    unlock.actions.unlock({ plaintextKeyData })

                    error.setState(undefined)
                    settings.actions.load()
                    sync.actions.loadSyncInfo()
                })

                backend.setup.saveSetupInfo(ctx, {
                    isSetup: true,
                    setupAt: new Date(),
                    version: BUILD_INFO.version,
                })

                return
            }

            if (step.state === "initial-setup") {
                return
            }

            if (step.state === "configure-encryption") {
                if (!unmounts.setupCandidatePrivateCryptoKeyEffect) {
                    unmounts.setupCandidatePrivateCryptoKeyEffect =
                        setupCandidatePrivateCryptoKeyEffect.mount()
                }
                return
            }

            if (step.state === "start-sync") {
                if (!unmounts.syncEffect) {
                    unmounts.syncEffect = syncEffect.mount()
                }

                if (!unmounts.authEffect) {
                    unmounts.authEffect = authEffect.mount()
                }

                step.setState("sync")
                sync.actions.syncStartDownloadFull()
                return
            }
        },
        autoMount: true,
        deps: [step],
        eager: false,
    })
}

const _actions = createActions({
    setErrorAndGoToStep: (nextStep: SetupStep, nextError: Error) => {
        step.setState(nextStep)
        error.setState(nextError)
    },
})

if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
        if (!newModule) {
            return
        }

        newModule.isSetup.setState(isSetup.state)
        newModule.step.setState(step.state)
        newModule.selectedOptions.setState(selectedOptions.state)
    })
}
