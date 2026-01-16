/** biome-ignore-all lint/correctness/useUniqueElementIds: is guaranteed to be unique */

import { useStore } from "@tanstack/react-store"
import clsx from "clsx"
import React, { Activity, startTransition, useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/ui/components/Button"
import { Dialog } from "@/ui/components/Dialog"
import {
    CaretLeftIcon,
    CloudActivatedIcon,
    CloudDeactivatedIcon,
    DatabaseIcon,
    GlobeIcon,
    InfoIcon,
    KeyIcon,
    PaletteIcon,
} from "@/ui/components/Icons"
import { useIsMobile } from "@/ui/hooks/useIsMobile"
import { useT } from "@/ui/i18n"
import { selectors, stores } from "@/ui/stores"

import { AboutTab } from "./AboutTab"
import { APITokensTab } from "./APITokensTab"
import { DataTab } from "./DataTab"
import { InterfaceSettingsTab } from "./InterfaceSettingsTab"
import { LocaleSettingsTab } from "./LocaleSettingsTab"
import { SyncSettingsTab } from "./SyncSettingsTab"
import { useSettingsModalState } from "./useSettingsModalState"
export function SettingsScreen() {
    let { isOpen, onClose } = useSettingsModalState()

    return (
        <Dialog isModal={true} open={isOpen} isKeyboardDismissable={false} onClose={onClose}>
            <Dialog.Content className="settings-dialog">
                <SettingsScreenContent />
            </Dialog.Content>
        </Dialog>
    )
}

function SettingsScreenContent() {
    let t = useT("screens/Settings")

    let { tabListRef, isSyncEnabled, activeTab, setActiveTab, focussed, onKeyDown } =
        useSettingsScreenTabs()

    let onClickBack = useCallback(() => {
        setActiveTab(undefined)
    }, [setActiveTab])

    return (
        <div className="settings-screen">
            <Dialog.Title>
                <h1>{t.Title}</h1>
            </Dialog.Title>

            <div className="settings-tabs">
                <Button
                    className="settings-tab-back-btn"
                    iconRight={<CaretLeftIcon />}
                    aria-label="Back"
                    onClick={onClickBack}
                />

                <div
                    role="tablist"
                    aria-label={t.TabListLabel}
                    className="settings-tab-list"
                    aria-orientation="vertical"
                    onKeyDown={onKeyDown}
                    ref={tabListRef}
                >
                    <Tab
                        index={0}
                        activeTab={activeTab}
                        focussed={focussed}
                        setActiveTab={setActiveTab}
                    >
                        <PaletteIcon className="icon" aria-hidden="true" />
                        {t.TabLabelInterface}
                    </Tab>
                    <Tab
                        index={1}
                        activeTab={activeTab}
                        focussed={focussed}
                        setActiveTab={setActiveTab}
                    >
                        <GlobeIcon className="icon" aria-hidden="true" />
                        {t.TabLabelLangLocale}
                    </Tab>
                    <Tab
                        index={2}
                        activeTab={activeTab}
                        focussed={focussed}
                        setActiveTab={setActiveTab}
                    >
                        {isSyncEnabled ? (
                            <CloudActivatedIcon className="icon" aria-hidden="true" />
                        ) : (
                            <CloudDeactivatedIcon className="icon" aria-hidden="true" />
                        )}
                        {t.TabLabelSync}
                    </Tab>
                    <Tab
                        index={3}
                        activeTab={activeTab}
                        focussed={focussed}
                        setActiveTab={setActiveTab}
                        isDisabled={!isSyncEnabled}
                    >
                        <KeyIcon className="icon" aria-hidden="true" />
                        {t.TabLabelAPITokens}
                    </Tab>
                    <Tab
                        index={4}
                        activeTab={activeTab}
                        focussed={focussed}
                        setActiveTab={setActiveTab}
                    >
                        <DatabaseIcon className="icon" aria-hidden="true" />
                        {t.TabLabelData}
                    </Tab>
                    <Tab
                        index={5}
                        activeTab={activeTab}
                        focussed={focussed}
                        setActiveTab={setActiveTab}
                    >
                        <InfoIcon className="icon" aria-hidden="true" />
                        {t.TabLabelAbout}
                    </Tab>
                </div>
                <TabPanel index={0} activeTab={activeTab}>
                    <InterfaceSettingsTab />
                </TabPanel>
                <TabPanel index={1} activeTab={activeTab}>
                    <LocaleSettingsTab />
                </TabPanel>
                <TabPanel index={2} activeTab={activeTab}>
                    <SyncSettingsTab />
                </TabPanel>
                <TabPanel index={3} activeTab={activeTab}>
                    <APITokensTab />
                </TabPanel>
                <TabPanel index={4} activeTab={activeTab}>
                    <DataTab />
                </TabPanel>
                <TabPanel index={5} activeTab={activeTab}>
                    <AboutTab />
                </TabPanel>
            </div>
        </div>
    )
}

const Tab = React.memo(function Tab({
    children,
    index,
    isDisabled = false,
    activeTab,
    focussed,
    setActiveTab,
}: React.PropsWithChildren<{
    index: number
    isDisabled?: boolean
    focussed?: number
    activeTab?: SettingsTab
    setActiveTab: (tab: SettingsTab) => void
}>) {
    let onClick = useCallback(() => {
        setActiveTab(settingsTabs[index])
    }, [index, setActiveTab])

    let onKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            switch (e.code) {
                case "Enter":
                case "Space":
                    setActiveTab(settingsTabs[index])
                    e.stopPropagation()
                    e.preventDefault()
                    return
            }
        },
        [index, setActiveTab],
    )

    return (
        <button
            type="button"
            id={settingsTabs[index]}
            className={clsx("settings-tab-list-item", { "has-focus": index === focussed })}
            role="tab"
            tabIndex={index === focussed ? 0 : -1}
            aria-selected={activeTab === settingsTabs[index]}
            aria-controls={`${settingsTabs[index]}-tabpanel`}
            aria-disabled={isDisabled}
            onClick={!isDisabled ? onClick : undefined}
            onKeyDown={!isDisabled ? onKeyDown : undefined}
        >
            {children}
        </button>
    )
})

const TabPanel = React.memo(function TabPanel({
    children,
    index,
    activeTab,
}: React.PropsWithChildren<{
    index: number
    activeTab?: SettingsTab
}>) {
    let isActive = activeTab === settingsTabs[index]
    let ref = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (isActive) {
            ref.current?.scrollIntoView({ behavior: "smooth" })
        }
    }, [isActive])

    return (
        <Activity mode={isActive ? "visible" : "hidden"}>
            <div
                id={`${settingsTabs[index]}-tabpanel`}
                className="settings-tab"
                role="tabpanel"
                aria-labelledby={settingsTabs[index]}
                aria-hidden={!isActive}
                inert={!isActive}
                ref={ref}
            >
                {children}
            </div>
        </Activity>
    )
})

const settingsTabs = ["interface", "lang-locale", "sync", "apitokens", "data", "about"]
const apiTokensTabIndex = 3

type SettingsTab = (typeof settingsTabs)[number]

function useSettingsScreenTabs() {
    let isMobile = useIsMobile()
    let tabListRef = useRef<HTMLDivElement | null>(null)
    let isSyncEnabled = useStore(stores.sync.info, selectors.sync.isEnabled)
    let [activeTab, _setActiveTab] = useState<SettingsTab | undefined>(
        isMobile ? undefined : "interface",
    )
    let [focussed, _setFocussed] = useState<number>(0)

    let setActiveTab = useCallback((tab?: SettingsTab) => {
        let tabBtn = tabListRef.current?.querySelector(`[tabindex="0"]`)
        if (!tab && tabBtn) {
            tabBtn.addEventListener(
                "focus",
                () => {
                    setTimeout(() => {
                        startTransition(() => {
                            _setFocussed(tab ? settingsTabs.indexOf(tab) : 0)
                            _setActiveTab(tab)
                        })
                    }, 200)
                },
                { once: true },
            )

            tabBtn.scrollIntoView({ behavior: "smooth" })
            ;(tabBtn as HTMLElement).focus({ preventScroll: true })
        } else {
            startTransition(() => {
                _setFocussed(tab ? settingsTabs.indexOf(tab) : 0)
                _setActiveTab(tab)
            })
        }
    }, [])

    let setFocussed = useCallback(
        (index: number) => {
            startTransition(() => {
                _setFocussed((prev) => {
                    let correctedIndex = index
                    if (isSyncEnabled || correctedIndex !== apiTokensTabIndex) {
                        document.getElementById(settingsTabs[correctedIndex])?.focus()
                        return correctedIndex
                    }

                    if (prev > correctedIndex) {
                        correctedIndex--
                    } else {
                        correctedIndex++
                    }

                    document.getElementById(settingsTabs[correctedIndex])?.focus()
                    return correctedIndex
                })
            })
        },
        [isSyncEnabled],
    )

    let onKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.altKey || e.ctrlKey || e.metaKey) {
                return
            }

            let handled = false
            let target = e.target as HTMLElement
            let tab = target.id as SettingsTab
            if (!tab) {
                return
            }

            switch (e.code) {
                case "Enter":
                case "Space":
                    setActiveTab(tab)
                    handled = true
                    break

                case "ArrowUp":
                    setFocussed(Math.max(settingsTabs.indexOf(tab) - 1, 0))
                    handled = true
                    break

                case "ArrowDown":
                    setFocussed(Math.min(settingsTabs.indexOf(tab) + 1, settingsTabs.length - 1))
                    handled = true
                    break

                case "Home":
                    setFocussed(0)
                    handled = true
                    break

                case "End":
                    setFocussed(settingsTabs.length - 1)
                    handled = true
                    break
            }

            if (handled) {
                e.stopPropagation()
                e.preventDefault()
            }
        },
        [setActiveTab, setFocussed],
    )

    return {
        tabListRef,
        isSyncEnabled,
        activeTab,
        setActiveTab,
        focussed,
        onKeyDown,
    }
}
