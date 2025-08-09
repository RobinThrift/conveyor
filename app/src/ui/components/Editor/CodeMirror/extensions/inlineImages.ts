import { syntaxTree } from "@codemirror/language"
import type { Range } from "@codemirror/state"
import {
    Decoration,
    type DecorationSet,
    type EditorView,
    ViewPlugin,
    type ViewUpdate,
    WidgetType,
} from "@codemirror/view"
import { type AttachmentID, attachmentIDFromURL } from "@/domain/Attachment"
import type { AsyncResult } from "@/lib/result"

type GetAttachmentDataByID = (id: AttachmentID) => AsyncResult<{ data: Uint8Array }>

export const inlineImages = (getAttachmentDataByID: GetAttachmentDataByID) =>
    ViewPlugin.fromClass(
        class {
            decorations: DecorationSet

            constructor(view: EditorView) {
                this.decorations = renderImages(view, getAttachmentDataByID)
            }

            update(update: ViewUpdate) {
                if (
                    update.docChanged ||
                    update.viewportChanged ||
                    syntaxTree(update.startState) !== syntaxTree(update.state)
                ) {
                    this.decorations = renderImages(update.view, getAttachmentDataByID)
                }
            }
        },
        {
            decorations: (v) => v.decorations,
        },
    )

function renderImages(view: EditorView, getAttachmentDataByID: GetAttachmentDataByID) {
    let widgets: Range<Decoration>[] = []
    for (let { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
            from,
            to,
            enter: (node) => {
                if (node.name !== "Image") {
                    return
                }

                let text = view.state.doc.sliceString(node.from, node.to)
                let imgSrcStart = text.indexOf("(")
                let imgSrcEnd = text.lastIndexOf(")")
                let imgSrc = text.substring(imgSrcStart + 1, imgSrcEnd)

                let widget = Decoration.widget({
                    widget: new ImageWidget({
                        src: imgSrc,
                        getAttachmentDataByID,
                    }),
                })
                widgets.push(widget.range(node.to))
            },
        })
    }
    return Decoration.set(widgets)
}

class ImageWidget extends WidgetType {
    private readonly _src: string
    private readonly _getAttachmentDataByID: GetAttachmentDataByID
    private _dom?: HTMLImageElement

    constructor({
        src,
        getAttachmentDataByID,
    }: { src: string; getAttachmentDataByID: GetAttachmentDataByID }) {
        super()
        this._src = src
        this._getAttachmentDataByID = getAttachmentDataByID
    }

    eq(widget: WidgetType): boolean {
        return this._src === (widget as ImageWidget)._src
    }

    toDOM() {
        this._dom = document.createElement("img")
        this._dom.className = "max-h-[50dvh]"

        let attachment = attachmentIDFromURL(this._src)
        if (attachment?.attachmentID) {
            this._getAttachmentDataByID(attachment.attachmentID).then(([data, err]) => {
                if (err) {
                    console.error(err)
                    return
                }

                if (!this._dom || !data?.data) {
                    return
                }

                this._dom.src = URL.createObjectURL(new Blob([data?.data]))
            })
        } else {
            this._dom.src = this._src
        }

        return this._dom
    }

    get lineBreaks(): number {
        return 1
    }

    get estimatedHeight(): number {
        return this._dom?.height ?? 0
    }
}
