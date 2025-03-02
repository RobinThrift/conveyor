import { create } from "@bufbuild/protobuf"

// @ts-expect-error: extension is required when running TS files with Node
import { DatabaseInterfaceTSFile } from "./DatabaseInterfaceTSFile.ts"
import type { Options } from "./Options.ts"
// @ts-expect-error: extension is required when running TS files with Node
import { QueryTSFile } from "./QueryTSFile.ts"
// @ts-expect-error: extension is required when running TS files with Node
import { UtilsTSFile } from "./UtilsTSFile.ts"
// @ts-expect-error: extension is required when running TS files with Node
import { WasmSQLite3Driver, argName, colName } from "./driver.ts"
import {
    type File,
    FileSchema,
    type GenerateRequest,
    type GenerateResponse,
    GenerateResponseSchema,
    type Query,
} from "./proto/codegen_pb.js"

export function generate(
    input: GenerateRequest,
    options: Options,
): GenerateResponse {
    let files: File[] = []

    let queryFiles = new Map<string, Query[]>()

    for (let query of input.queries) {
        if (!queryFiles.has(query.filename)) {
            queryFiles.set(query.filename, [])
        }
        let qs = queryFiles.get(query.filename)
        qs?.push(query)
    }

    for (let [filename, queries] of queryFiles.entries()) {
        let file = new QueryTSFile(
            `${filename.replace(".", "_")}.ts`,
            queries,
            options,
        )
        files.push(
            create(FileSchema, {
                name: file.name,
                contents: new TextEncoder().encode(file.toString()),
            }),
        )
    }

    let utilsFile = new UtilsTSFile()
    files.push(
        create(FileSchema, {
            name: utilsFile.name,
            contents: new TextEncoder().encode(utilsFile.toString()),
        }),
    )

    let dbInterfaceFile = new DatabaseInterfaceTSFile()
    files.push(
        create(FileSchema, {
            name: dbInterfaceFile.name,
            contents: new TextEncoder().encode(dbInterfaceFile.toString()),
        }),
    )

    return create(GenerateResponseSchema, { files })
}
