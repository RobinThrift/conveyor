import { useEffect } from "react"
import { useBaseURL } from "./useBaseURL"

export function useEnsureLoggedIn(enabled: boolean) {
    let baseURL = useBaseURL()
    useEffect(() => {
        if (!enabled) {
            return
        }

        let onVisibilityChange = async () => {
            if (document.hidden) {
                return
            }

            let ok = false

            try {
                let res = await fetch(`${baseURL}/check_login`)
                ok = res.ok && res.status === 200
            } catch {
                // do nothing, redirecet
            }

            if (!ok) {
                window.location.href = `${window.location.protocol}//${window.location.host}${baseURL}`
            }
        }

        document.addEventListener("visibilitychange", onVisibilityChange)

        return () =>
            document.removeEventListener("visibilitychange", onVisibilityChange)
    }, [enabled, baseURL])
}
