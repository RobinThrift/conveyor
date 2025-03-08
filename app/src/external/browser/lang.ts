export function getNavigatorLang(available: string[]): string | undefined {
    if (typeof navigator === "undefined") {
        return
    }

    let languages = navigator.languages
    if (!navigator.languages) languages = [navigator.language]

    for (let language of languages) {
        if (available.includes(language)) {
            return language
        }
    }
}
