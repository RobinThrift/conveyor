import type { Context } from "@/lib/context"
import { type AsyncResult, Err, Ok } from "@/lib/result"
import { createWorker } from "@/lib/worker"

export const TestWorker = createWorker({
    concat: async (_: Context, args: { strArg: string; numArg: number }): AsyncResult<string> => {
        return Ok(`${args.strArg}.${args.numArg}`)
    },

    errResult: async (_: Context, _args: { foo: string }): AsyncResult<void> => {
        return Err(new Error("error result"))
    },
})

TestWorker.runIfWorker()
