import type { Job, JobTrigger } from "@/jobs"

export class JobController {
    private _triggers: JobTrigger[] = []

    scheduleJob(job: Job, trigger: JobTrigger) {
        trigger.registerJob(job)
        this._triggers.push(trigger)
    }

    start() {
        this._triggers.forEach((t) => t.start())
    }

    stop() {
        this._triggers.forEach((t) => t.stop())
    }
}
