import { useT } from "@/i18n"
import React from "react"

export type OtherError = {
    title: string
    detail: string
}

export type TranslatedError = {
    t: string
}

export type ErrorPageProps = {
    className?: string
    code: number
} & (OtherError | TranslatedError)

export function ErrorPage(props: ErrorPageProps) {
    let t = useT(`pages/Errors/${(props as TranslatedError).t}` as any) as {
        Title: string
        Detail: string
    }
    let title = "title" in props ? props.title : t.Title
    let detail = "detail" in props ? props.detail : t.Detail

    let code = props.code.toString()

    return (
        <div className="error-page">
            <div className="login-page-bg" aria-hidden>
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
