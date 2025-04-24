export function isVisibleInViewPort(el: HTMLElement | null): boolean {
    if (!el) {
        return false
    }
    if (!window.visualViewport) {
        return true
    }

    let { top, bottom } = el.getBoundingClientRect()
    let { height: vpHeight } = window.visualViewport

    let isVisible = (top >= 0 && top <= vpHeight) || bottom < vpHeight
    return isVisible
}
