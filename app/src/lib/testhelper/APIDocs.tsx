import { ApiReferenceReact } from "@scalar/api-reference-react"
import React from "react"
import "@scalar/api-reference-react/style.css"

export function APIDocs({ url }: { url: string }) {
    return (
        <ApiReferenceReact
            configuration={{
                url: url,
                defaultHttpClient: {
                    targetKey: "go",
                    clientKey: "native",
                },
            }}
        />
    )
}
