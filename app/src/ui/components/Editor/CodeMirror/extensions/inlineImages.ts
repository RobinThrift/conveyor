import { syntaxTree } from "@codemirror/language"
import { type EditorState, type Extension, type Range, StateField } from "@codemirror/state"
import { Decoration, type DecorationSet, EditorView, type Rect, WidgetType } from "@codemirror/view"

import { type AttachmentID, imageBlobToSrc, parseAttachmentURL } from "@/domain/Attachment"
import type { AsyncResult } from "@/lib/result"

type GetAttachmentDataByID = (
    id: AttachmentID,
) => AsyncResult<{ data: Uint8Array<ArrayBuffer>; mime: string }>

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
    private _attachment: ReturnType<typeof parseAttachmentURL>
    private _estimatedHeight: number = -1

    constructor({
        src,
        getAttachmentDataByID,
    }: { src: string; getAttachmentDataByID: GetAttachmentDataByID }) {
        super()
        this._src = src
        this._getAttachmentDataByID = getAttachmentDataByID
        this._attachment = parseAttachmentURL(src)
        this._estimatedHeight = this._attachment?.height ?? -1
    }

    public get estimatedHeight(): number {
        console.log("estimatedHeight", this._estimatedHeight)
        return this._estimatedHeight
    }

    eq(widget: WidgetType): boolean {
        return this._src === (widget as ImageWidget)._src
    }

    updateDOM(dom: HTMLElement, _: EditorView): boolean {
        dom = document.createElement("img")
        dom.className = "cm-img"
        dom.setAttribute("aria-hidden", "true")

        dom.addEventListener(
            "load",
            () => {
                this._estimatedHeight = this._dom?.height ?? -1
            },
            { once: true, passive: true },
        )

        dom.addEventListener(
            "error",
            (err) => {
                console.error("error loading image", err)
            },
            { once: true, passive: true },
        )

        if (this._attachment?.attachmentID) {
            this._getAttachmentDataByID(this._attachment.attachmentID).then(([data, err]) => {
                if (err) {
                    console.error(err)
                    return
                }

                if (!this._dom || !data?.data) {
                    return
                }
                this._dom.src = imageBlobToSrc(data)
            })
        } else {
            ;(dom as HTMLImageElement).src = this._src
        }

        return true
    }

    toDOM(view: EditorView) {
        this._dom = document.createElement("img")
        this.updateDOM(this._dom, view)
        return this._dom
    }

    destroy(dom: HTMLElement): void {
        let src = (dom as HTMLImageElement)?.src
        if (src.startsWith("blob:")) {
            URL.revokeObjectURL(src)
        }
    }

    coordsAt(_dom: HTMLElement, _pos: number, _side: number): Rect | null {
        return null
    }
}
