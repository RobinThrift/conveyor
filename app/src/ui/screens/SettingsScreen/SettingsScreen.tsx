import React, { type Key, useCallback } from "react"
import {
    Tab as AriaTab,
    TabList as AriaTabList,
    TabPanel as AriaTabPanel,
    Tabs as AriaTabs,
} from "react-aria-components"
import { useSelector } from "react-redux"

import { Dialog } from "@/ui/components/Dialog"
import {
    CloudCheckIcon,
    CloudSlashIcon,
    DatabaseIcon,
    GlobeIcon,
    InfoIcon,
    KeyIcon,
    PaletteIcon,
} from "@/ui/components/Icons"
import { useIsMobile } from "@/ui/hooks/useIsMobile"
import { useT } from "@/ui/i18n"
import { useCurrentPage, useNavigation } from "@/ui/navigation"
import { selectors } from "@/ui/state"

import { APITokensTab } from "./APITokensTab"
import { AboutTab } from "./AboutTab"
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
    let isSyncEnabled = useSelector(selectors.sync.isEnabled)

    let isMobile = useIsMobile()

    let nav = useNavigation()
    let currentPage = useCurrentPage()
    let tab = "tab" in currentPage.params ? currentPage.params.tab : "interface"

    let onChangeTab = useCallback(
        (tab: Key) => {
            nav.updateParams({ tab: tab as string })
        },
        [nav.updateParams],
    )

    return (
        <div className="settings-screen">
            <Dialog.Title>
                <h1>{t.Title}</h1>
            </Dialog.Title>

            <AriaTabs
                selectedKey={tab}
                onSelectionChange={onChangeTab}
                className="settings-tabs"
                orientation={isMobile ? "horizontal" : "vertical"}
            >
                <AriaTabList aria-label={t.TabListLabel} className="settings-tab-list">
                    <AriaTab id="interface" className="settings-tab-list-item">
                        <PaletteIcon weight="fill" className="icon" />
                        {t.TabLabelInterface}
                    </AriaTab>
                    <AriaTab id="lang-locale" className="settings-tab-list-item">
                        <GlobeIcon weight="fill" className="icon" />
                        {t.TabLabelLangLocale}
                    </AriaTab>
                    <AriaTab id="sync" className="settings-tab-list-item">
                        {isSyncEnabled ? (
                            <CloudCheckIcon weight="fill" className="icon" />
                        ) : (
                            <CloudSlashIcon weight="fill" className="icon" />
                        )}
                        {t.TabLabelSync}
                    </AriaTab>
                    {isSyncEnabled && (
                        <AriaTab id="apitokens" className="settings-tab-list-item">
                            <KeyIcon weight="fill" className="icon" />
                            {t.TabLabelAPITokens}
                        </AriaTab>
                    )}
                    <AriaTab id="data" className="settings-tab-list-item">
                        <DatabaseIcon weight="fill" className="icon" />
                        {t.TabLabelData}
                    </AriaTab>
                    <AriaTab id="about" className="settings-tab-list-item">
                        <InfoIcon weight="fill" className="icon" />
                        {t.TabLabelAbout}
                    </AriaTab>
                </AriaTabList>
                <AriaTabPanel id="interface" className="settings-tab">
                    <InterfaceSettingsTab />
                </AriaTabPanel>
                <AriaTabPanel id="lang-locale" className="settings-tab">
                    <LocaleSettingsTab />
                </AriaTabPanel>
                <AriaTabPanel id="sync" className="settings-tab">
                    <SyncSettingsTab />
                </AriaTabPanel>
                {isSyncEnabled && (
                    <AriaTabPanel id="apitokens" className="settings-tab">
                        <APITokensTab />
                    </AriaTabPanel>
                )}
                <AriaTabPanel id="data" className="settings-tab">
                    <DataTab />
                </AriaTabPanel>
                <AriaTabPanel id="about" className="settings-tab">
                    <AboutTab />
                </AriaTabPanel>
            </AriaTabs>
        </div>
    )
}
