import type { ChangelogController } from "@/control/ChangelogController"
import type { MemoController } from "@/control/MemoController"
import type { Job } from "@/jobs"
import { CleanupJob } from "@/jobs/CleanupJob"
import { BaseContext } from "@/lib/context"
import type { StartListening } from "@/ui/state/rootStore"

import { slice as jobs } from "./slice"

export const registerEffects = (
    startListening: StartListening,
    {
        memoCtrl,
        changelogCtrl,
    }: {
        memoCtrl: MemoController
        changelogCtrl: ChangelogController
    },
) => {
    startListening({
        actionCreator: jobs.actions.startJob,
        effect: async ({ payload }, { signal, dispatch }) => {
            let job: Job | undefined = undefined
            if (payload.job === "cleanup") {
                job = new CleanupJob({ memoCtrl, changelogCtrl })
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
            try {
                await job.run(BaseContext.withSignal(signal))
            } catch (err) {
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
