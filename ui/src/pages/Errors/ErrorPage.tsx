import React from "react"

export interface ErrorPageProps {
    className?: string

    code: number
    title: string
    detail: string
}

export function ErrorPage(props: ErrorPageProps) {
    return (
        <div className="grid h-screen place-content-center px-4">
            <div className="text-center">
                <h1 className="text-9xl font-black text-primary">
                    {props.code}
                </h1>

                <p className="text-2xl font-bold tracking-tight sm:text-4xl">
                    {props.title}
                </p>

                <p className="mt-4 text-subtle-extra-dark">{props.detail}</p>
            </div>
        </div>
    )
}
