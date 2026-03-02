import type { Meta, StoryObj } from "@storybook/react-vite"
import React, { useEffect, useState } from "react"

import "@/ui/styles/index.css"

import { ModelAttachment } from "./ModelAttachment"

const meta: Meta<typeof ModelAttachment> = {
    title: "Attachments/Viewers/Models",
    component: ModelAttachment,
    render: (args) => {
        let [attachment, setAttachment] = useState(args.attachment || {})

        useEffect(() => {
            if (attachment.data) {
                return
            }

            let mime = attachment.mime

            let url = ""
            switch (mime) {
                case "model/stl":
                    url = new URL("./testdata/cube.stl", import.meta.url).href
                    break
                case "model/obj":
                    url = new URL("./testdata/cube.obj", import.meta.url).href
                    break
                case "model/glb":
                    url = new URL("./testdata/cube.glb", import.meta.url).href
                    break
                case "model/gltf":
                    url = new URL("./testdata/cube.gltf", import.meta.url).href
                    break
                case "model/err":
                    url = new URL("./testdata/cube.invalid", import.meta.url).href
                    mime = "model/stl"
                    break
            }

            if (!url) {
                return
            }

            let abortCtrl = new AbortController()

            fetch(url, { signal: abortCtrl.signal })
                .then((res) => {
                    return res.blob()
                })
                .then((body) => body.arrayBuffer())
                .then((arrayBuffer) => {
                    setAttachment({
                        mime,
                        data: new Uint8Array(arrayBuffer),
                        originalFilename: attachment.originalFilename,
                    })
                })
                .catch((err) => console.error(err))

            return () => {
                abortCtrl.abort()
            }
        }, [attachment.data, attachment.mime, attachment.originalFilename])

        return (
            <div className="flex items-center justify-center w-full h-full">
                <div className="flex-1 flex items-center justify-center min-w-[300px] max-w-[600px] h-full @container">
                    <ModelAttachment {...args} attachment={attachment} />
                </div>
            </div>
        )
    },
}

export default meta
type Story = StoryObj<typeof ModelAttachment>

export const STLObject: Story = {
    args: {
        attachment: {
            mime: "model/stl",
            originalFilename: "cube.stl",
        },
    },
}

export const ObjObject: Story = {
    args: {
        attachment: {
            mime: "model/obj",
            originalFilename: "cube.obj",
        },
    },
}

export const GLBObject: Story = {
    args: {
        attachment: {
            mime: "model/glb",
            originalFilename: "cube.glb",
        },
    },
}

export const GLTFObject: Story = {
    args: {
        attachment: {
            mime: "model/gltf",
            originalFilename: "cube.gltf",
        },
    },
}

export const ErrobObj: Story = {
    args: {
        attachment: {
            mime: "model/err",
            originalFilename: "cube.err",
        },
    },
}
