import { nanoid } from "nanoid"

import { BaseContext } from "@/lib/context"
import { isMainThread } from "@/lib/thread"

import { Backend } from "./Backend"
import { init } from "./backend.init"
import { registerJobs } from "./jobs"

declare global {
    var __IS_RUNNING__: boolean
}

declare const __ENABLE_DEVTOOLS__: boolean

if (!("__IS_RUNNING__" in globalThis)) {
    globalThis.__IS_RUNNING__ = true
    run().catch((err) => console.error(err))
}

async function run() {
    if (isMainThread()) {
        return
    }

    let { controller, autoUnlockResult, fs, db } = await init(BaseContext)

    let backend = new Backend({ postMessage: globalThis.postMessage.bind(globalThis) }, controller)

    globalThis.addEventListener("message", backend.onMessage.bind(backend))

    registerJobs({
        jobCtrl: controller.jobCtrl,
        memoCtrl: controller.memoCtrl,
        syncController: controller.syncCtrl,
        changelogCtrl: controller.changelogCtrl,
        db,
        fs,
        rootEventTarget: backend,
    })

    backend.sendNotification("init/autoUnlock", autoUnlockResult)

    if (__ENABLE_DEVTOOLS__) {
        forwardPerformanceEntries()
    }
}

function forwardPerformanceEntries() {
    let observer = new PerformanceObserver((list) => {
        self.postMessage({
            id: nanoid(),
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
