import type { ChangelogController } from "@/control/ChangelogController"
import type { MemoController } from "@/control/MemoController"
import type { Job } from "@/jobs"
import { CleanupJob } from "@/jobs/CleanupJob"
import { BaseContext } from "@/lib/context"
import type { Database } from "@/lib/database"
import type { FS } from "@/lib/fs"
import type { StartListening } from "@/ui/state/rootStore"

import { ExportJob } from "@/jobs/ExportJob"
import { slice as jobs } from "./slice"

export const registerEffects = (
    startListening: StartListening,
    {
        memoCtrl,
        changelogCtrl,
        db,
        fs,
    }: {
        memoCtrl: MemoController
        changelogCtrl: ChangelogController
        db: Database
        fs: FS
    },
) => {
    startListening({
        actionCreator: jobs.actions.startJob,
        effect: async ({ payload }, { signal, dispatch }) => {
            let job: Job | undefined = undefined
            switch (payload.job) {
                case "cleanup":
                    job = new CleanupJob({ memoCtrl, changelogCtrl })
                    break
                case "export":
                    job = new ExportJob({
                        db,
                        fs,
                        filename: payload.params.filename,
                        privateKey: payload.params.privateKey,
                    })
                    break
            }
            if (!job) {
                return
            }

            dispatch(
                jobs.actions.setJobStatus({
                    job: payload.job,
                    status: "running",
                }),
            )

            let [_, err] = await job.run(BaseContext.withSignal(signal))
            if (err) {
                dispatch(
                    jobs.actions.setJobStatus({
                        job: payload.job,
                        status: "error",
                        error: err as Error,
                    }),
                )
                return
            }

            dispatch(
                jobs.actions.setJobStatus({
                    job: payload.job,
                    status: "done",
                }),
            )
        },
    })
}
