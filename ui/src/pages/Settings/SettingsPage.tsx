import { useT } from "@/i18n"
import { Globe, Palette, User, Wrench } from "@phosphor-icons/react"
import * as Tabs from "@radix-ui/react-tabs"
import React from "react"
import { AccountSettingsTab } from "./AccountSettingsTab"
import { InterfaceSettingsTab } from "./InterfaceSettingsTab"
import { LocaleSettingsTab } from "./LocaleSettingsTab"
import { SystemSettingsTab } from "./SystemSettingsTab"

export interface SettingsPageProps {
    tab: string
    onChangeTab: (tab: string) => void
    validationErrors?: {
        display_name?: string
        current_password?: string
        new_password?: string
        repeat_new_password?: string
    }
}

export function SettingsPage(props: SettingsPageProps) {
    let t = useT("pages/Settings/Tabs")

    return (
        <Tabs.Root
            className="container mx-auto max-w-4xl flex flex-col gap-2 justify-center"
            defaultValue={props.tab}
            onValueChange={props.onChangeTab}
        >
            <Tabs.List className="settings-tab-list">
                <Tabs.Trigger
                    value="interface"
                    className="settings-tab-list-item"
                >
                    <Palette /> {t.Interface}
                </Tabs.Trigger>
                <Tabs.Trigger value="locale" className="settings-tab-list-item">
                    <Globe /> {t.Locale}
                </Tabs.Trigger>
                <Tabs.Trigger
                    value="account"
                    className="settings-tab-list-item"
                >
                    <User /> {t.Account}
                </Tabs.Trigger>
                <Tabs.Trigger value="system" className="settings-tab-list-item">
                    <Wrench /> {t.System}
                </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="interface" asChild>
                <InterfaceSettingsTab />
            </Tabs.Content>

            <Tabs.Content value="locale" asChild>
                <LocaleSettingsTab />
            </Tabs.Content>

            <Tabs.Content value="account" asChild>
                <AccountSettingsTab validationErrors={props.validationErrors} />
            </Tabs.Content>

            <Tabs.Content value="system" asChild>
                <SystemSettingsTab />
            </Tabs.Content>
        </Tabs.Root>
    )
}
