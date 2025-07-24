import type { ChangelogController } from "@/control/ChangelogController"
import type { JobController } from "@/control/JobController"
import type { MemoController } from "@/control/MemoController"
import type { SyncController } from "@/control/SyncController"
import { CleanupJob } from "@/jobs/CleanupJob"
import { ExportJob } from "@/jobs/ExportJob"
import { FullSyncJob } from "@/jobs/FullSyncJob"
import { SyncJob } from "@/jobs/SyncJob"
import type { Database } from "@/lib/database"
import { Minute } from "@/lib/duration"
import type { FS } from "@/lib/fs"

type Events = {
    "ui/visibliyChanged": undefined
    "ui/online": undefined
}

export function registerJobs({
    changelogCtrl,
    db,
    fs,
    jobCtrl,
    memoCtrl,
    syncController,
    rootEventTarget,
}: {
    changelogCtrl: ChangelogController
    memoCtrl: MemoController
    db: Database
    fs: FS
    jobCtrl: JobController
    syncController: SyncController
    rootEventTarget: {
        addEventListener<K extends keyof Events>(
            event: K,
            cb: (data: Events[K]) => void,
        ): () => void
        removeEventListener<K extends keyof Events>(event: K, cb: (data: Events[K]) => void): void
    }
}) {
    jobCtrl.registerJob("sync", new SyncJob({ syncController }))

    jobCtrl.registerJob("fullSync", new FullSyncJob({ syncController }))

    jobCtrl.scheduleJob("sync", 5 * Minute)
    jobCtrl.scheduleJob("fullSync", 30 * Minute)

    jobCtrl.triggerJobOnEvent("sync", rootEventTarget, "ui/online")
    jobCtrl.triggerJobOnEvent("sync", rootEventTarget, "ui/visibliyChanged")

    jobCtrl.registerJob("export", new ExportJob({ db, fs }))

    jobCtrl.registerJob("cleanup", new CleanupJob({ changelogCtrl, memoCtrl }))
}
