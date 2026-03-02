import React, { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { OBJLoader } from "three/addons/loaders/OBJLoader.js"
import { STLLoader } from "three/addons/loaders/STLLoader.js"

import { Alert } from "@/ui/components/Alert"
import { CloudArrowDownIcon } from "@/ui/components/Icons"
import { Checkbox } from "@/ui/components/Input/Checkbox"
import { useT } from "@/ui/i18n"

RectAreaLightUniformsLib.init()

export function ModelAttachment({
    attachment,
}: {
    attachment: {
        data?: Uint8Array<ArrayBuffer>
        mime?: string
        originalFilename?: string
    }
}) {
    let t = useT("components/Memo/Attachments/Viewers/ModelAttachment")
    let [showGrid, setShowGrid] = useState(false)

    let ref = useRef<HTMLCanvasElement | null>(null)
    let { src, error } = useModelAttachment({ ref, attachment, showGrid })

    return (
        <div className="attachment-model">
            <div className="attachment-model-controls">
                <Checkbox
                    label={t.ControlShowGrid}
                    name="show-grid"
                    value={showGrid}
                    onChange={(checked) => setShowGrid(checked as boolean)}
                />
            </div>

            <div className="attachment-model-info">
                {attachment.originalFilename}
                {src && (
                    <a href={src} download={attachment.originalFilename}>
                        <span className="sr-only">{t.Download}</span>
                        <CloudArrowDownIcon />
                    </a>
                )}
            </div>

            {error && <Alert>{error.toString()}</Alert>}
            <canvas ref={ref} width="300" height="200" />
        </div>
    )
}

function useModelAttachment({
    ref,
    attachment,
    showGrid,
}: {
    ref: React.RefObject<HTMLCanvasElement | null>
    attachment: {
        data?: Uint8Array<ArrayBuffer>
        mime?: string
    }
    showGrid: boolean
}) {
    let [src, setSrc] = useState(() => {
        let data = attachment.data
        if (!data) {
            return
        }
        return URL.createObjectURL(new Blob([data]))
    })

    useEffect(() => {
        let data = attachment.data
        if (!data) {
            return
        }

        let objURL = URL.createObjectURL(new Blob([data]))
        setSrc(objURL)

        return () => {
            URL.revokeObjectURL(objURL)
        }
    }, [attachment.data])

    let [isVisible, setIsVisible] = useState(false)

    let [error, setError] = useState<Error | undefined>(undefined)

    let [scene] = useState(() => {
        let scene = new THREE.Scene()

        let bgColor =
            window.getComputedStyle(document.body).getPropertyValue("--color-body-bg") || "white"

        if (bgColor !== "white") {
            let ofc = new OffscreenCanvas(1, 1)
            let ctx = ofc.getContext("2d", { willReadFrequently: true })
            if (ctx) {
                ctx.fillStyle = bgColor
                ctx.fillRect(0, 0, 1, 1)
                let rgb = ctx.getImageData(0, 0, 1, 1).data
                bgColor = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
            }
            scene.background = new THREE.Color(bgColor)
        }

        scene.background = new THREE.Color(bgColor)

        let light = new THREE.AmbientLight(0x808080)
        scene.add(light)

        return scene
    })

    let [camera] = useState<THREE.PerspectiveCamera>(() => {
        let fov = 45
        let aspect = 4 / 3
        let near = 0.1
        let far = 1000
        let camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
        camera.position.set(0, 50, 100)
        return camera
    })

    let controls = useRef<OrbitControls | undefined>(undefined)

    useEffect(() => {
        if (ref.current) {
            ref.current.style.contentVisibility = "auto"
        }

        let onContentVisibilityAutoStateChange = (e: Event) => {
            let evt = e as ContentVisibilityAutoStateChangeEvent
            setIsVisible(!evt.skipped)
        }

        ref.current?.addEventListener(
            "contentvisibilityautostatechange",
            onContentVisibilityAutoStateChange,
            { passive: true },
        )

        return () => {
            ref.current?.removeEventListener(
                "contentvisibilityautostatechange",
                onContentVisibilityAutoStateChange,
            )
        }
    }, [ref.current])

    useEffect(() => {
        let canvas = ref.current
        if (!isVisible || !canvas) {
            return
        }

        if (!controls.current) {
            controls.current = new OrbitControls(camera, ref.current)
            controls.current.update()
        }

        let renderer = new THREE.WebGLRenderer({ antialias: true, canvas })

        let raf: ReturnType<typeof requestAnimationFrame> | undefined

        let resizeRendererToDisplaySize = (renderer?: THREE.WebGLRenderer) => {
            if (!renderer) {
                return false
            }

            let canvas = renderer.domElement
            let width = canvas.clientWidth
            let height = canvas.clientHeight
            let needResize = canvas.width !== width || canvas.height !== height
            if (needResize) {
                renderer.setSize(width, height, false)
            }

            return needResize
        }

        let render = () => {
            if (!camera) {
                return
            }

            if (resizeRendererToDisplaySize(renderer)) {
                let canvas = renderer.domElement
                camera.aspect = canvas.clientWidth / canvas.clientHeight
                camera.updateProjectionMatrix()
            }

            renderer.render(scene, camera)

            raf = requestAnimationFrame(render)
        }

        raf = requestAnimationFrame(render)

        return () => {
            if (raf) {
                cancelAnimationFrame(raf)
            }

            renderer.dispose()

            controls.current?.dispose()
            controls.current = undefined
        }
    }, [isVisible, ref.current, scene, camera])

    useEffect(() => {
        if (!isVisible || !src || !camera || !controls) {
            return
        }

        let cancelled = false

        let obj3DRef: THREE.Object3D | undefined
        let light = new THREE.RectAreaLight(0xffffff, 1, 100, 200)

        let material = new THREE.MeshStandardMaterial({
            flatShading: true,
            color: 0xfefefe,
        })

        let loadMesh: Promise<{ obj3D: THREE.Object3D; boundingBox: THREE.Box3 }> | undefined

        switch (attachment.mime) {
            case "model/stl":
                loadMesh = loadSTL(src, material)
                break
            case "model/obj":
                loadMesh = loadObj(src, material)
                break
            case "model/gltf":
            case "model/glb":
                loadMesh = loadGLTF(src, material)
                break
        }

        if (!loadMesh) {
            return
        }

        loadMesh
            .then(({ obj3D, boundingBox }) => {
                if (cancelled) {
                    return
                }

                let width = boundingBox.max.x - boundingBox.min.x
                let height = boundingBox.max.y - boundingBox.min.y

                obj3DRef = obj3D

                scene.add(obj3D)

                camera.position.x = boundingBox.min.x + width * 1.5
                camera.position.y = boundingBox.min.y + height * 1.5
                camera.position.z = boundingBox.max.z + width + height / 2

                let target = new THREE.Vector3(
                    boundingBox.min.x + width / 2,
                    boundingBox.min.y + height / 2,
                    obj3D.position.z,
                )

                camera.lookAt(target)

                if (controls.current) {
                    controls.current.target = target
                }

                light.position.set(0, boundingBox.min.y + height * 2, 0)
                light.rotation.x = THREE.MathUtils.degToRad(-80)
                light.rotation.y = THREE.MathUtils.degToRad(-10)
                light.rotation.z = THREE.MathUtils.degToRad(-10)

                scene.add(light)
            })
            .catch((err) => setError(err))

        return () => {
            cancelled = true
            if (obj3DRef) {
                scene.remove(obj3DRef)
            }
            obj3DRef?.traverse((node) => {
                if ("dispose" in node && typeof node.dispose === "function") {
                    node.dispose()
                }
            })

            scene.remove(light)
            light.dispose()

            material.dispose()
        }
    }, [src, isVisible, scene, attachment.mime, camera])

    useEffect(() => {
        if (!isVisible) {
            return
        }

        if (!showGrid) {
            return
        }

        let size = 500
        let divisions = 10
        let gridHelper = new THREE.GridHelper(size, divisions)
        scene.add(gridHelper)

        return () => {
            scene.remove(gridHelper)
            gridHelper.dispose()
        }
    }, [scene, showGrid, isVisible])

    return { error, src }
}

async function loadSTL(
    src: string,
    material: THREE.MeshStandardMaterial,
): Promise<{ obj3D: THREE.Object3D; boundingBox: THREE.Box3 }> {
    let loader = new STLLoader()

    let geometry = await loader.loadAsync(src)
    geometry.center()

    let mesh = new THREE.Mesh(geometry, material)

    let boundingBox = new THREE.Box3()
    boundingBox.setFromObject(mesh)

    let height = boundingBox.max.y - boundingBox.min.y

    mesh.position.x = 0
    mesh.position.y = height / 2
    mesh.position.z = 0

    boundingBox = new THREE.Box3()
    boundingBox.setFromObject(mesh)

    return {
        obj3D: mesh,
        boundingBox,
    }
}

async function loadObj(
    src: string,
    material: THREE.MeshStandardMaterial,
): Promise<{ obj3D: THREE.Object3D; boundingBox: THREE.Box3 }> {
    let loader = new OBJLoader()

    let group = await loader.loadAsync(src)

    group.traverse((node) => {
        if (node.type === "Mesh") {
            let m = node as THREE.Mesh

            for (let mat of Array.isArray(m.material) ? m.material : [m.material]) {
                if (mat.name === "DefaultMaterial") {
                    m.material = material
                    break
                }
            }
        }
    })

    let boundingBox = new THREE.Box3()
    boundingBox.setFromObject(group)

    return {
        obj3D: group,
        boundingBox,
    }
}

async function loadGLTF(
    src: string,
    material: THREE.MeshStandardMaterial,
): Promise<{ obj3D: THREE.Object3D; boundingBox: THREE.Box3 }> {
    let loader = new GLTFLoader()

    let group = await loader.loadAsync(src)

    group.scene.traverse((node) => {
        if (node.type === "Mesh") {
            let m = node as THREE.Mesh

            for (let mat of Array.isArray(m.material) ? m.material : [m.material]) {
                if (mat.name === "DefaultMaterial") {
                    m.material = material
                    break
                }
            }
        }
    })

    let boundingBox = new THREE.Box3()
    boundingBox.setFromObject(group.scene)

    return {
        obj3D: group.scene,
        boundingBox,
    }
}
