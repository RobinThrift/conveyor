import { ViewPlugin, type ViewUpdate } from "@codemirror/view"

export const toolbarPositionFix = ViewPlugin.fromClass(
    class {
        update(update: ViewUpdate) {
            if (update.viewportChanged) {
                return
            }

            update.view.requestMeasure({
                read: (view) => {
                    let rect = view.coordsAtPos(view.state.selection.main.from)
                    let visualViewportHeight = window.visualViewport?.height
                    if (!rect || !visualViewportHeight) {
                        return
                    }

                    if (
                        rect.top >=
                        visualViewportHeight - view.defaultLineHeight * 3
                    ) {
                        requestAnimationFrame(() => {
                            document.documentElement.scrollTo(
                                document.documentElement.scrollLeft,
                                document.documentElement.scrollTop +
                                    view.defaultLineHeight * 2,
                            )
                        })
                    } else {
                        setTimeout(() => {
                            let rect = view.coordsAtPos(
                                view.state.selection.main.from,
                            )
                            let visualViewportHeight =
                                window.visualViewport?.height
                            if (!rect || !visualViewportHeight) {
                                return
                            }

                            if (
                                rect.top >=
                                visualViewportHeight -
                                    view.defaultLineHeight * 3
                            ) {
                                document.documentElement.scrollTo(
                                    document.documentElement.scrollLeft,
                                    document.documentElement.scrollTop +
                                        view.defaultLineHeight * 2,
                                )
                            }
                        }, 350)
                    }
                },
            })
        }
    },
)
