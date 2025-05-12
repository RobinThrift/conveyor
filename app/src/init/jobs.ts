import type { JobController } from "@/control/JobController"
import { EventJobTrigger, ScheduleJobTrigger } from "@/jobs"
import { SyncJob } from "@/jobs/SyncJob"
import { Minute } from "@/lib/duration"
import type { RootStore } from "@/ui/state"

export function initJobs({
    jobCtrl,
    rootStore,
}: { jobCtrl: JobController; rootStore: RootStore }) {
    let syncJob = new SyncJob(rootStore.dispatch)

    jobCtrl.scheduleJob(
        syncJob,
        new EventJobTrigger(globalThis as WorkerGlobalScope, "online"),
    )

    jobCtrl.scheduleJob(syncJob, new ScheduleJobTrigger(5 * Minute))

    jobCtrl.start()
}
