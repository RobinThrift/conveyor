import { argv, exit, stdin as processStdin, stdout } from "node:process"

import { fromBinary, toBinary } from "@bufbuild/protobuf"
// @ts-expect-error: extension is required when running TS files with Node
import { generate } from "./generate.ts"
import {
    type GenerateRequest,
    GenerateRequestSchema,
    type GenerateResponse,
    GenerateResponseSchema,
} from "./proto/codegen_pb.js"

async function main(_: string[], stdin: typeof processStdin) {
    let request = await readGenerateRequest(stdin)
    let options = JSON.parse(new TextDecoder().decode(request.pluginOptions))
    let response = generate(request, options)
    writeOutput(response)
}

function readGenerateRequest(stream: NodeJS.ReadStream) {
    return new Promise<GenerateRequest>((resolve) => {
        let chunks: Buffer<ArrayBufferLike>[] = []

        stream.on("readable", () => {
            for (
                let data: Buffer = stream.read();
                data !== null;
                data = stream.read()
            ) {
                chunks.push(data)
            }
            // let data: Buffer
            // // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
            // while ((data = stream.read()) !== null) {
            // }
        })

        stream.on("end", () => {
            let input = Buffer.concat(chunks)
            resolve(fromBinary(GenerateRequestSchema, input))
        })
    })
}

function writeOutput(output: GenerateResponse) {
    let buffer = toBinary(GenerateResponseSchema, output)
    stdout.write(buffer)
}

main(argv.slice(2), processStdin).catch((e) => {
    console.error(e)
    exit(1)
})
