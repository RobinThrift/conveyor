export interface UpdateSettingsRequest {
    "locale.language": string
    "locale.region": string
    "theme.colourScheme": string
    "theme.mode": string
    "theme.icon": string
    "controls.vim": boolean
    "controls.doubleClickToEdit"?: boolean
}

export async function update({
    settings,
    baseURL = "",
    signal,
}: {
    settings: UpdateSettingsRequest
    baseURL?: string
    signal?: AbortSignal
}): Promise<void> {
    let url = new URL(`${baseURL}/api/v1/settings`, globalThis.location.href)

    let res = await fetch(url, {
        signal,
        method: "PATCH",
        body: JSON.stringify(settings),
    })

    if (!res.ok || res.status !== 204) {
        throw new Error(
            `error updating settings: ${res.status} ${res.statusText}`,
        )
    }
}
