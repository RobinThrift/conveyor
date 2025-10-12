import { syntaxTree } from "@codemirror/language"
import { type EditorState, type Extension, type Range, StateField } from "@codemirror/state"
import { Decoration, type DecorationSet, EditorView, type Rect, WidgetType } from "@codemirror/view"
import { type AttachmentID, attachmentIDFromURL } from "@/domain/Attachment"
import type { AsyncResult } from "@/lib/result"

type GetAttachmentDataByID = (id: AttachmentID) => AsyncResult<{ data: Uint8Array }>

export const inlineImages = (getAttachmentDataByID: GetAttachmentDataByID): Extension => {
    return StateField.define<DecorationSet>({
        create(state) {
            return decorate(state, getAttachmentDataByID)
        },

        update(widgets, transaction) {
            if (transaction.docChanged) {
                return decorate(transaction.state, getAttachmentDataByID)
            }

            return widgets.map(transaction.changes)
        },

        provide(field) {
            return EditorView.decorations.from(field)
        },
    })
}

function decorate(state: EditorState, getAttachmentDataByID: GetAttachmentDataByID) {
    let widgets: Range<Decoration>[] = []
    syntaxTree(state).iterate({
        enter: (node) => {
            if (node.name !== "Image") {
                return
            }

            let text = state.doc.sliceString(node.from, node.to)
            let imgSrcStart = text.indexOf("(")
            let imgSrcEnd = text.lastIndexOf(")")
            let imgSrc = text.substring(imgSrcStart + 1, imgSrcEnd)

            let widget = Decoration.widget({
                widget: new ImageWidget({
                    src: imgSrc,
                    getAttachmentDataByID,
                }),
                block: true,
                side: -1,
            })
            widgets.push(widget.range(state.doc.lineAt(node.from).from))
        },
    })

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

    toDOM(view: EditorView) {
        this._dom = document.createElement("img")
        this._dom.className = "cm-img"
        this._dom.setAttribute("aria-hidden", "true")

        this._dom.addEventListener(
            "load",
            () => {
                setTimeout(() => {
                    view.requestMeasure()
                }, 1000)
            },
            { once: true },
        )

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

    coordsAt(dom: HTMLElement, pos: number, side: number): Rect | null {
        console.log("side", side)
        console.log("pos", pos)
        console.log("dom", dom)
        return null
    }
}
