import React from "react"

import { useT } from "@/ui/i18n"

export type OtherError = {
    title: string
    detail: string
}

export type TranslatedError = {
    t: string
}

export type ErrorScreenProps = {
    className?: string
    code: number
} & (OtherError | TranslatedError)

export function ErrorScreen(props: ErrorScreenProps) {
    let t = useT(`screens/Errors/${(props as TranslatedError).t}` as any) as {
        Title: string
        Detail: string
    }
    let title = "title" in props ? props.title : t.Title
    let detail = "detail" in props ? props.detail : t.Detail

    let code = props.code.toString()

    return (
        <div className="error-screen">
            <div className="unlock-page-bg" aria-hidden>
                <div className="spot-3" />
                <div className="spot-2" />
                <div className="spot-1" />
                <div className="noise" />
            </div>

            <div className="error-code" aria-valuetext={code}>
                <span className="error-code-middle">{code[1].repeat(16)}</span>
                <span>
                    {code[0]}
                    <em>{code[1]}</em>
                    {code[2]}
                </span>
            </div>

            <div className="message">
                <h1>{title}</h1>

                <p>{detail}</p>
            </div>
        </div>
    )
}
