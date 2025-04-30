import React from "react"

import { Env } from "@/env"
import { InfoPopover } from "@/ui/components/InfoPopover"
import { Checkbox } from "@/ui/components/Input/Checkbox"
import { useT } from "@/ui/i18n"

export const StoreUnlockKeyCheckbox = React.memo(
    function StoreUnlockKeyCheckbox({
        isDisabled,
    }: {
        isDisabled?: boolean
    }) {
        let t = useT("screens/Unlock/StoreUnlockKeyCheckbox")

        let checkbox: React.ReactNode | null = null
        let text: string | null = null
        if (Env.platform === "web" || Env.platform === "pwa") {
            if (Env.isDeviceSecureStorageAvailable) {
                checkbox = (
                    <Checkbox
                        key="store_key_checkbox"
                        name="store_key"
                        label={t.LabelDeviceSecureStorageWeb}
                        isDisabled={isDisabled}
                    />
                )
                text = t.ExplainerDeviceSecureStorageWeb
            } else {
                checkbox = (
                    <Checkbox
                        key="store_key_checkbox"
                        name="store_key"
                        label={t.LabelWebSession}
                        isDisabled={isDisabled}
                    />
                )
                text = t.ExplainerWebSession
            }
        } else if (
            Env.isDeviceSecureStorageAvailable &&
            Env.platform === "macos"
        ) {
            checkbox = (
                <Checkbox
                    name="store_key"
                    key="store_key_checkbox"
                    label={t.LabelDeviceSecureStorageNative}
                    isDisabled={isDisabled}
                />
            )
            text = t.ExplainerDeviceSecureStorageNative
        }

        if (!checkbox) {
            return null
        }

        return (
            <div className="flex gap-1 items-center">
                {checkbox}
                {text && (
                    <InfoPopover aria-label={t.ExplainerPopupLabel}>
                        <p>{text}</p>
                    </InfoPopover>
                )}
            </div>
        )
    },
)
