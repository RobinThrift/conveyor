import { useT } from "@/i18n"
import { Globe, Palette, User, Wrench } from "@phosphor-icons/react"
import * as Accordion from "@radix-ui/react-accordion"
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
    let t = useT("pages/Settings")
    let tInterface = useT("pages/Settings/InterfaceSettings")
    let tLocale = useT("pages/Settings/LocaleSettings")
    let tAccount = useT("pages/Settings/AccountSettings")
    let tSystem = useT("pages/Settings/SystemSettings")

    return (
        <div className="settings-page">
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
                        <Palette weight="fill" className="icon" />
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
                        <Globe weight="fill" className="icon" />
                    </Accordion.Trigger>

                    <Accordion.Content asChild>
                        <LocaleSettingsTab />
                    </Accordion.Content>
                </Accordion.Item>

                <Accordion.Item
                    value="account"
                    className="settings-section bg-danger text-danger-contrast"
                >
                    <Accordion.Trigger
                        value="account"
                        className="settings-heading"
                    >
                        <h2>{tAccount.Title}</h2>
                        <small>{tAccount.Description}</small>
                        <User weight="fill" className="icon" />
                    </Accordion.Trigger>

                    <Accordion.Content asChild>
                        <AccountSettingsTab
                            validationErrors={props.validationErrors}
                        />
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
                        <h2>{tSystem.Title}</h2>
                        <Wrench weight="fill" className="icon" />
                    </Accordion.Trigger>

                    <Accordion.Content asChild>
                        <SystemSettingsTab />
                    </Accordion.Content>
                </Accordion.Item>
            </Accordion.Root>
        </div>
    )
}
