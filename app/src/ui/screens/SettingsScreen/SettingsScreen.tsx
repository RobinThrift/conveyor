import * as Accordion from "@radix-ui/react-accordion"
import React from "react"

import { GlobeIcon, PaletteIcon, WrenchIcon } from "@/ui/components/Icons"
import { useT } from "@/ui/i18n"

import { InterfaceSettingsTab } from "./InterfaceSettingsTab"
import { LocaleSettingsTab } from "./LocaleSettingsTab"
import { SyncSettingsTab } from "./SyncSettingsTab"

export interface SettingsScreenProps {
    tab: string
    onChangeTab: (tab: string) => void
    validationErrors?: {
        display_name?: string
        current_password?: string
        new_password?: string
        repeat_new_password?: string
    }
}

export function SettingsScreen(props: SettingsScreenProps) {
    let t = useT("screens/Settings")
    let tInterface = useT("screens/Settings/InterfaceSettings")
    let tLocale = useT("screens/Settings/LocaleSettings")
    let tSync = useT("screens/Settings/SyncSettings")

    return (
        <div className="settings-screen">
            <h1>{t.Title}</h1>

            <Accordion.Root
                className="flex flex-col gap-2 justify-center"
                type="single"
                defaultValue={props.tab}
                onValueChange={props.onChangeTab}
            >
                <Accordion.Item
                    value="interface"
                    className="settings-section bg-primary text-primary-contrast"
                >
                    <Accordion.Trigger
                        value="interface"
                        className="settings-heading outline-primary-extra-dark"
                    >
                        <h2>{tInterface.Title}</h2>
                        <small>{tInterface.Description}</small>
                        <PaletteIcon weight="fill" className="icon" />
                    </Accordion.Trigger>

                    <Accordion.Content asChild>
                        <InterfaceSettingsTab />
                    </Accordion.Content>
                </Accordion.Item>

                <Accordion.Item
                    value="locale"
                    className="settings-section bg-success text-success-contrast"
                >
                    <Accordion.Trigger
                        value="locale"
                        className="settings-heading"
                    >
                        <h2>{tLocale.Title}</h2>
                        <small>{tLocale.Description}</small>
                        <GlobeIcon weight="fill" className="icon" />
                    </Accordion.Trigger>

                    <Accordion.Content asChild>
                        <LocaleSettingsTab />
                    </Accordion.Content>
                </Accordion.Item>

                <Accordion.Item
                    value="system"
                    className="settings-section bg-subtle text-subtle-contrast"
                >
                    <Accordion.Trigger
                        value="system"
                        className="settings-heading"
                    >
                        <h2>{tSync.Title}</h2>
                        <WrenchIcon weight="fill" className="icon" />
                    </Accordion.Trigger>

                    <Accordion.Content asChild>
                        <SyncSettingsTab />
                    </Accordion.Content>
                </Accordion.Item>
            </Accordion.Root>
        </div>
    )
}
