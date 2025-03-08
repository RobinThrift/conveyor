export function prefersColorScheme(): "light" | "dark" {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
}
