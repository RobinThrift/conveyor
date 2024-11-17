export function useCSRFToken(): string {
    let el = document.querySelector("meta[name=csrf-token]")
    return el?.getAttribute("content") ?? ""
}
