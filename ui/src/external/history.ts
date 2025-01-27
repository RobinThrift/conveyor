class History {
    constructor() {
        window.history.scrollRestoration = "auto"
    }

    get current(): string {
        if (import.meta.env.VITE_USE_HASH_HISTORY) {
            if (!window.location.hash) {
                return "/"
            }

            try {
                let loc = JSON.parse(
                    decodeURIComponent(window.location.hash).substring(1),
                )
                let params = new URLSearchParams(loc.params)
                return `${loc.path}?${params.toString()}`
            } catch {
                return "/"
            }
        }

        return window.location.href
    }

    get length(): number {
        return window.history.length
    }

    pushState(path: string, params?: URLSearchParams) {
        let nextURL = this.nextURL(path, params)
        window.history.pushState(null, "", nextURL)

        window.scrollTo(0, 0)
    }

    replaceState(path: string, params?: URLSearchParams) {
        let nextURL = this.nextURL(path, params)
        window.history.pushState(null, "", nextURL)
    }

    back() {
        window.history.back()
    }

    private nextURL(path: string, params?: URLSearchParams): URL {
        if (import.meta.env.VITE_USE_HASH_HISTORY) {
            let nextURL = new URL(window.location.href)
            let hash = JSON.stringify({
                path,
                params: params ? Object.fromEntries(params.entries()) : {},
            })
            nextURL.hash = encodeURIComponent(hash)
            return nextURL
        }

        let nextURL = new URL(path, window.location.href)
        params?.forEach((key, value) => {
            nextURL.searchParams.set(key, value)
        })

        return nextURL
    }
}

export const history = new History()
