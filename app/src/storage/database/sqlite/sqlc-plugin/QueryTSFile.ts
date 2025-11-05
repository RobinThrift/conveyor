import { factory, type ImportSpecifier, type Node } from "typescript"

import type { Options } from "./Options.ts"
import type { Query } from "./proto/codegen_pb.js"
import {
    astToString,
    fullColumName,
    generateExecQueryFunctionDeclaration,
    generateExecRowsQueryFunctionDeclaration,
    generateImportDeclaration,
    generateManyQueryFunctionDeclaration,
    generateOneQueryFunctionDeclaration,
    generateQueryArgsInterfaceDeclaration,
    generateQueryReturnInterfaceDeclaration,
    generateQueryTextDeclaration,
    validateQueryColumns,
    // @ts-expect-error: extension is required when running TS files with Node
} from "./utils.ts"

export class QueryTSFile {
    name: string
    private nodes: Node[] = []
    private imports: Record<string, ImportSpecifier[]> = {}
    private options: Options

    constructor(name: string, queries: Query[], options: Options) {
        this.name = name
        this.options = options
        this.generate(queries)
    }

    public toString() {
        return astToString(this.name, [...generateImportDeclaration(this.imports), ...this.nodes])
    }

    private addImport(named: ImportSpecifier[], from: string) {
        let imports = this.imports[from]
        if (!imports) {
            imports = []
            this.imports[from] = imports
        }

        for (let n of named) {
            if (imports.find((i) => i.name.escapedText === n.name.escapedText)) {
                continue
            }
            imports.push(n)
        }
    }

    private generate(queries: Query[]) {
        this.addImport(
            [factory.createImportSpecifier(true, undefined, factory.createIdentifier("Database"))],
            "./db",
        )

        this.addImport(
            [
                factory.createImportSpecifier(
                    false,
                    undefined,
                    factory.createIdentifier("mapRowToObj"),
                ),
            ],
            "./utils",
        )

        for (let query of queries) {
            this.generateQuery(query)
        }
    }

    private generateQuery(query: Query) {
        validateQueryColumns(query)

        if (!this.options) {
            this.options = { overrides: [] }
        }

        console.error(query.columns)

        query.columns
            .filter((c) => c.type?.name.toLowerCase() === "boolean")
            .forEach((c) => {
                let colName = fullColumName(c)
                if (this.options.overrides?.find((o) => colName === o.column)) {
                    return
                }

                this.options?.overrides?.push({
                    column: colName,
                    from_sql: {
                        import: "./utils",
                        fn: "numberToBool",
                    },
                })
            })

        for (let override of this.options?.overrides ?? []) {
            if (!query.columns.find((c) => fullColumName(c) === override.column)) {
                continue
            }

            if (override.from_sql?.import) {
                this.addImport(
                    [
                        factory.createImportSpecifier(
                            false,
                            undefined,
                            factory.createIdentifier(override.from_sql.fn),
                        ),
                    ],
                    override.from_sql.import,
                )
            }

            if (override.to_sql?.import) {
                this.addImport(
                    [
                        factory.createImportSpecifier(
                            false,
                            undefined,
                            factory.createIdentifier(override.to_sql.fn),
                        ),
                    ],
                    override.to_sql.import,
                )
            }

            if (typeof override.type === "object" && override.type.import) {
                this.addImport(
                    [
                        factory.createImportSpecifier(
                            false,
                            undefined,
                            factory.createIdentifier(override.type.name),
                        ),
                    ],
                    override.type.import,
                )
            }
        }

        let funcName = query.name[0].toLowerCase() + query.name.slice(1)
        let queryTextVarName = `${funcName}Query`

        this.nodes.push(generateQueryTextDeclaration(queryTextVarName, query))

        let queryArgInterfaceName: string | undefined
        if (query.params.length > 0) {
            queryArgInterfaceName = `${query.name}Args`
            this.nodes.push(
                generateQueryArgsInterfaceDeclaration(
                    queryArgInterfaceName,
                    query.params,
                    this.options.overrides,
                ),
            )
        }

        let queryReturnInterfaceName: string | undefined
        if (query.columns.length > 0) {
            queryReturnInterfaceName = `${query.name}Row`
            this.nodes.push(
                generateQueryReturnInterfaceDeclaration(
                    queryReturnInterfaceName,
                    query.columns,
                    this.options.overrides,
                ),
            )
        }

        switch (query.cmd) {
            case ":exec":
                this.nodes.push(
                    generateExecQueryFunctionDeclaration(
                        funcName,
                        queryTextVarName,
                        queryArgInterfaceName,
                        query.params,
                        this.options,
                    ),
                )
                break
            case ":execrows":
                this.nodes.push(
                    generateExecRowsQueryFunctionDeclaration(
                        funcName,
                        queryTextVarName,
                        queryArgInterfaceName,
                        query.params,
                        this.options,
                    ),
                )
                break
            case ":one": {
                this.nodes.push(
                    generateOneQueryFunctionDeclaration(
                        funcName,
                        queryTextVarName,
                        queryArgInterfaceName,
                        queryReturnInterfaceName ?? "void",
                        query.params,
                        query.columns,
                        this.options,
                    ),
                )
                break
            }
            case ":many": {
                this.nodes.push(
                    generateManyQueryFunctionDeclaration(
                        funcName,
                        queryTextVarName,
                        queryArgInterfaceName,
                        queryReturnInterfaceName ?? "void",
                        query.params,
                        query.columns,
                        this.options,
                    ),
                )
                break
            }
            default:
                throw new Error(`unsupported query cmd ${query.cmd}`)
        }
    }
}
