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

    return (
        <div className="grid h-screen place-content-center px-4">
            <div className="text-center">
                <h1 className="text-9xl font-black text-primary">
                    {props.code}
                </h1>

                <p className="text-2xl font-bold tracking-tight sm:text-4xl">
                    {title}
                </p>

                <p className="mt-4 text-subtle-extra-dark">{detail}</p>
            </div>
        </div>
    )
}
