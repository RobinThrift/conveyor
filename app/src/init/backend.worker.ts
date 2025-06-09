import type { AttachmentController } from "@/control/AttachmentController"
import type { AttachmentID } from "@/domain/Attachment"
import { BaseContext } from "@/lib/context"

import { newID } from "@/domain/ID"
import { trace } from "@/lib/tracing"
import { tryAutoUnlock } from "./autounlock"
import { initController } from "./controller"
import { initJobs } from "./jobs"
import type { InitPlatform } from "./platform"
import { initRootStore } from "./store"

declare const __PLATFORM__: "TAURI" | "WEB"
declare const __ENABLE_DEVTOOLS__: boolean

declare global {
    var __IS_RUNNING__: boolean
}

if (!("__IS_RUNNING__" in globalThis)) {
    globalThis.__IS_RUNNING__ = true
    run().catch((err) => console.error(err))
}

async function run() {
    if (__ENABLE_DEVTOOLS__) {
        forwardPerformanceEntries()
    }

    let platform = await initPlatform()

    let controller = await initController(platform)

    let [initState, initStateErr] = await trace(
        BaseContext,
        "AutoUnlock",
        (ctx) =>
            tryAutoUnlock(ctx, {
                unlockCtrl: controller.unlockCtrl,
                settingsCtrl: controller.settingsCtrl,
                setupCtrl: controller.setupCtrl,
                syncCtrl: controller.syncCtrl,
            }),
    )

    if (initStateErr) {
        throw initStateErr
    }

    setupAttachmentLoader(controller.attachmentCtrl)

    let rootStore = initRootStore(initState, {
        ...controller,
        fs: platform.fs,
        db: platform.db,
    })

    initJobs({ jobCtrl: controller.jobCtrl, rootStore: rootStore })

    if (!initState?.setup.isSetup) {
        controller.navCtrl.push({
            screen: { name: "setup", params: {} },
            restore: { scrollOffsetTop: 0 },
        })
        return
    }

    if (initState?.unlock.state === "locked") {
        controller.navCtrl.push({
            screen: { name: "unlock", params: {} },
            restore: { scrollOffsetTop: 0 },
        })
    }
}

async function initPlatform() {
    let platformInit: InitPlatform
    if (__PLATFORM__ === "TAURI") {
        platformInit = (await import("./platform.tauri")).init
    } else {
        platformInit = (await import("./platform.web")).init
    }

    return platformInit({
        db: {
            onError: (err) => {
                console.error(err)
            },
        },
        fs: {
            baseDir: "",
            onError: (err) => {
                console.error(err)
            },
        },
    })
}

function setupAttachmentLoader(attachmentCtrl: AttachmentController) {
    self.addEventListener(
        "message",
        (
            evt: MessageEvent<{
                id: string
                type: "attachment:getAttachmentDataByID:request"
                data: { id: AttachmentID }
            }>,
        ) => {
            let msg = evt.data
            if (msg?.type !== "attachment:getAttachmentDataByID:request") {
                return
            }

            evt.stopImmediatePropagation()

            attachmentCtrl
                .getAttachmentDataByID(BaseContext, msg.data.id)
                .then(([result, err]) => {
                    if (err) {
                        throw err
                    }

                    postMessage(
                        {
                            id: msg.id,
                            type: "attachment:getAttachmentDataByID:response",
                            data: [result, undefined],
                        },
                        { transfer: [result.data] },
                    )
                })
                .catch((err) => {
                    console.error(
                        "attachmentCtrl.getAttachmentDataByID error",
                        err,
                    )
                })
        },
    )
}

function forwardPerformanceEntries() {
    let observer = new PerformanceObserver((list) => {
        self.postMessage({
            id: newID(),
            type: "performance:marks",
            data: list.getEntries().map((entry) => ({
                name: entry.name,
                startTime: entry.startTime,
                detail: (entry as PerformanceMark).detail,
            })),
        })
    })

    observer.observe({
        type: "mark",
        buffered: true,
    })
}
