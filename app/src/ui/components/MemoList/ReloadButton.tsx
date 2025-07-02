import React from "react"

import { Button } from "@/ui/components/Button"
import { ArrowsClockwiseIcon } from "@/ui/components/Icons"
import { useT } from "@/ui/i18n"

export function ReloadButton({ reload }: { reload: () => void }) {
    let t = useT("components/MemoList/ReloadButton")

    return (
        <div className="memo-list-reload-btn">
            <small className="description animate-in slide-in-from-top">{t.Description}</small>

            <Button
                className="shadow-md animate-in slide-in-from-top text-sm"
                size="sm"
                onPress={reload}
                iconRight={<ArrowsClockwiseIcon />}
            >
                {t.Label}
            </Button>
        </div>
    )
}
