import {
    EmitHint,
    type Expression,
    type ImportSpecifier,
    type MemberName,
    NewLineKind,
    type Node,
    NodeFlags,
    ScriptKind,
    ScriptTarget,
    type Statement,
    SyntaxKind,
    type TypeNode,
    createPrinter,
    createSourceFile,
    factory,
} from "typescript"

import type { Options, Override } from "./Options.ts"
import type { Column, Parameter, Query } from "./proto/codegen_pb.js"

export function generateImportDeclaration(
    imports: Record<string, ImportSpecifier[]>,
) {
    let importNodes: Node[] = []
    for (let from in imports) {
        let specs = imports[from]
        let allTypeImports = specs.every((s) => s.isTypeOnly)

        importNodes.push(
            factory.createImportDeclaration(
                undefined,
                factory.createImportClause(
                    allTypeImports,
                    undefined,
                    factory.createNamedImports(
                        specs.map((s) => {
                            return {
                                ...s,
                                isTypeOnly: allTypeImports
                                    ? false
                                    : s.isTypeOnly,
                            }
                        }),
                    ),
                ),
                factory.createStringLiteral(from),
                undefined,
            ),
        )
    }

    return importNodes
}

export function generateQueryTextDeclaration(
    varName: string,
    query: { name: string; cmd: string; text: string },
) {
    let value = `-- name: ${query.name} ${query.cmd}
${query.text}`
    return factory.createVariableStatement(
        undefined,
        factory.createVariableDeclarationList(
            [
                factory.createVariableDeclaration(
                    factory.createIdentifier(varName),
                    undefined,
                    undefined,
                    factory.createNoSubstitutionTemplateLiteral(value, value),
                ),
            ],
            NodeFlags.Const,
        ),
    )
}

export function generateQueryArgsInterfaceDeclaration(
    name: string,
    params: Parameter[],
    overrides: Override[] = [],
) {
    return factory.createInterfaceDeclaration(
        [factory.createToken(SyntaxKind.ExportKeyword)],
        factory.createIdentifier(name),
        undefined,
        undefined,
        params.map((param, i) =>
            factory.createPropertySignature(
                undefined,
                factory.createIdentifier(argName(i, param.column)),
                undefined,
                createColumnType(
                    param.column,
                    overrides.find(
                        (o) =>
                            param.column &&
                            o.column === fullColumName(param.column),
                    ),
                ),
            ),
        ),
    )
}

export function generateQueryReturnInterfaceDeclaration(
    name: string,
    columns: Column[],
    overrides: Override[] = [],
) {
    return factory.createInterfaceDeclaration(
        [factory.createToken(SyntaxKind.ExportKeyword)],
        factory.createIdentifier(name),
        undefined,
        undefined,
        columns.map((column, i) =>
            factory.createPropertySignature(
                undefined,
                factory.createIdentifier(columnName(i, column)),
                undefined,
                createColumnType(
                    column,
                    overrides.find((o) => o.column === fullColumName(column)),
                ),
            ),
        ),
    )
}

export function generateExecQueryFunctionDeclaration(
    funcName: string,
    queryName: string,
    argIface: string | undefined,
    params: Parameter[],
    options?: Options,
) {
    let funcParams = createQueryFunctionParams(argIface, params)

    let { queryIdent, statements } = createSliceParamMacro(queryName, params)

    return factory.createFunctionDeclaration(
        [
            factory.createToken(SyntaxKind.ExportKeyword),
            factory.createToken(SyntaxKind.AsyncKeyword),
        ],
        undefined,
        factory.createIdentifier(funcName),
        undefined,
        funcParams,
        undefined,
        factory.createBlock(
            [
                ...statements,
                factory.createExpressionStatement(
                    factory.createAwaitExpression(
                        createDatabaseExecStatement(
                            queryIdent,
                            params,
                            "exec",
                            options,
                        ),
                    ),
                ),
            ],
            true,
        ),
    )
}

export function generateExecRowsQueryFunctionDeclaration(
    funcName: string,
    queryName: string,
    argIface: string | undefined,
    params: Parameter[],
    options?: Options,
) {
    let funcParams = createQueryFunctionParams(argIface, params)

    let { queryIdent, statements } = createSliceParamMacro(queryName, params)

    return factory.createFunctionDeclaration(
        [
            factory.createToken(SyntaxKind.ExportKeyword),
            factory.createToken(SyntaxKind.AsyncKeyword),
        ],
        undefined,
        factory.createIdentifier(funcName),
        undefined,
        funcParams,
        undefined,
        factory.createBlock(
            [
                ...statements,
                factory.createReturnStatement(
                    createDatabaseExecStatement(
                        queryIdent,
                        params,
                        "exec",
                        options,
                    ),
                ),
            ],
            true,
        ),
    )
}

export function generateOneQueryFunctionDeclaration(
    funcName: string,
    queryName: string,
    argIface: string | undefined,
    returnIface: string,
    params: Parameter[],
    columns: Column[],
    options: Options,
) {
    let funcParams = createQueryFunctionParams(argIface, params)

    let mapRowToObjParams: Expression[] = [factory.createIdentifier("result")]
    let overrides = findColumn(columns, options.overrides)
    if (overrides) {
        mapRowToObjParams.push(
            factory.createObjectLiteralExpression([
                ...Object.entries(overrides)
                    .filter(([_, entry]) => entry.from_sql)
                    .map(([name, override]) =>
                        factory.createPropertyAssignment(
                            strToCamelCase(name),
                            // biome-ignore lint/style/noNonNullAssertion: guaranteed to no be null because of the filter
                            factory.createIdentifier(override.from_sql!.fn),
                        ),
                    ),
            ]),
        )
    }

    let { queryIdent, statements } = createSliceParamMacro(queryName, params)

    return factory.createFunctionDeclaration(
        [
            factory.createToken(SyntaxKind.ExportKeyword),
            factory.createToken(SyntaxKind.AsyncKeyword),
        ],
        undefined,
        factory.createIdentifier(funcName),
        undefined,
        funcParams,

        factory.createTypeReferenceNode(factory.createIdentifier("Promise"), [
            factory.createUnionTypeNode([
                factory.createTypeReferenceNode(
                    factory.createIdentifier(returnIface),
                    undefined,
                ),
                factory.createLiteralTypeNode(factory.createNull()),
            ]),
        ]),

        factory.createBlock(
            [
                ...statements,
                factory.createVariableStatement(
                    undefined,
                    factory.createVariableDeclarationList(
                        [
                            factory.createVariableDeclaration(
                                factory.createIdentifier("result"),
                                undefined,
                                undefined,
                                factory.createAwaitExpression(
                                    createDatabaseExecStatement(
                                        queryIdent,
                                        params,
                                        "one",
                                        options,
                                    ),
                                ),
                            ),
                        ],
                        NodeFlags.Let | NodeFlags.TypeExcludesFlags,
                    ),
                ),
                factory.createIfStatement(
                    factory.createBinaryExpression(
                        factory.createIdentifier("result"),
                        factory.createToken(SyntaxKind.EqualsEqualsEqualsToken),
                        factory.createIdentifier("undefined"),
                    ),
                    factory.createBlock(
                        [factory.createReturnStatement(factory.createNull())],
                        true,
                    ),
                    undefined,
                ),
                factory.createReturnStatement(
                    factory.createCallExpression(
                        factory.createIdentifier("mapRowToObj"),
                        [factory.createTypeReferenceNode(returnIface)],
                        mapRowToObjParams,
                    ),
                ),
            ],
            true,
        ),
    )
}

export function generateManyQueryFunctionDeclaration(
    funcName: string,
    queryName: string,
    argIface: string | undefined,
    returnIface: string,
    params: Parameter[],
    columns: Column[],
    options: Options,
) {
    let funcParams = createQueryFunctionParams(argIface, params)

    let mapRowToObjParams: Expression[] = [factory.createIdentifier("row")]
    let overrides = findColumn(columns, options.overrides)
    if (overrides) {
        mapRowToObjParams.push(
            factory.createObjectLiteralExpression([
                ...Object.entries(overrides)
                    .filter(([_, entry]) => entry.from_sql)
                    .map(([name, override]) =>
                        factory.createPropertyAssignment(
                            strToCamelCase(name),
                            // biome-ignore lint/style/noNonNullAssertion: guaranteed to no be null because of the filter
                            factory.createIdentifier(override.from_sql!.fn),
                        ),
                    ),
            ]),
        )
    }

    let { queryIdent, statements } = createSliceParamMacro(queryName, params)

    return factory.createFunctionDeclaration(
        [
            factory.createToken(SyntaxKind.ExportKeyword),
            factory.createToken(SyntaxKind.AsyncKeyword),
        ],
        undefined,
        factory.createIdentifier(funcName),
        undefined,
        funcParams,

        factory.createTypeReferenceNode(factory.createIdentifier("Promise"), [
            factory.createArrayTypeNode(
                factory.createTypeReferenceNode(
                    factory.createIdentifier(returnIface),
                    undefined,
                ),
            ),
        ]),

        factory.createBlock(
            [
                ...statements,
                factory.createVariableStatement(
                    undefined,
                    factory.createVariableDeclarationList(
                        [
                            factory.createVariableDeclaration(
                                factory.createIdentifier("result"),
                                undefined,
                                undefined,
                                factory.createAwaitExpression(
                                    createDatabaseExecStatement(
                                        queryIdent,
                                        params,
                                        "many",
                                        options,
                                    ),
                                ),
                            ),
                        ],
                        NodeFlags.Let | NodeFlags.TypeExcludesFlags,
                    ),
                ),
                factory.createReturnStatement(
                    factory.createCallExpression(
                        factory.createPropertyAccessExpression(
                            factory.createIdentifier("result"),
                            factory.createIdentifier("map"),
                        ),
                        undefined,
                        [
                            factory.createArrowFunction(
                                undefined,
                                undefined,
                                [
                                    factory.createParameterDeclaration(
                                        undefined,
                                        undefined,
                                        factory.createIdentifier("row"),
                                        undefined,
                                        undefined,
                                        undefined,
                                    ),
                                ],
                                undefined,
                                undefined,
                                factory.createCallExpression(
                                    factory.createIdentifier("mapRowToObj"),
                                    [
                                        factory.createTypeReferenceNode(
                                            returnIface,
                                        ),
                                    ],
                                    mapRowToObjParams,
                                ),
                            ),
                        ],
                    ),
                ),
            ],
            true,
        ),
    )
}

function createQueryFunctionParams(
    iface: string | undefined,
    params: Parameter[],
) {
    let funcParams = [
        factory.createParameterDeclaration(
            undefined,
            undefined,
            factory.createIdentifier("database"),
            undefined,
            factory.createTypeReferenceNode(
                factory.createIdentifier("Database"),
                undefined,
            ),
            undefined,
        ),
    ]

    if (iface && params.length > 0) {
        funcParams.push(
            factory.createParameterDeclaration(
                undefined,
                undefined,
                factory.createIdentifier("args"),
                undefined,
                factory.createTypeReferenceNode(
                    factory.createIdentifier(iface),
                    undefined,
                ),
                undefined,
            ),
        )
    }

    funcParams.push(
        factory.createParameterDeclaration(
            undefined,
            undefined,
            factory.createIdentifier("abort"),
            factory.createToken(SyntaxKind.QuestionToken),
            factory.createTypeReferenceNode(
                factory.createIdentifier("AbortSignal"),
                undefined,
            ),
            undefined,
        ),
    )

    return funcParams
}

function createSliceParamMacro(queryName: string, params: Parameter[]) {
    let queryIdent = queryName
    let statements: Statement[] = []

    let sliceParam = params.find((p) => p.column?.isSqlcSlice)

    if (!sliceParam) {
        return { queryIdent, statements }
    }

    queryIdent = `${queryName}WithSliceParams`

    statements.push(
        factory.createVariableStatement(
            undefined,
            factory.createVariableDeclarationList(
                [
                    factory.createVariableDeclaration(
                        factory.createIdentifier(queryIdent),
                        undefined,
                        undefined,
                        factory.createCallExpression(
                            factory.createPropertyAccessExpression(
                                factory.createIdentifier(queryName),
                                factory.createIdentifier("replace"),
                            ),
                            undefined,
                            [
                                factory.createStringLiteral(
                                    `/*SLICE:${sliceParam.column?.name ?? sliceParam.number}*/?`,
                                ),
                                createProperyCallExp(
                                    factory.createArrayLiteralExpression(
                                        [
                                            factory.createSpreadElement(
                                                createCallChain(
                                                    [
                                                        factory.createIdentifier(
                                                            "Array",
                                                        ),
                                                        [
                                                            factory.createPropertyAccessExpression(
                                                                factory.createPropertyAccessExpression(
                                                                    factory.createIdentifier(
                                                                        "args",
                                                                    ),
                                                                    factory.createIdentifier(
                                                                        argName(
                                                                            sliceParam.number,
                                                                            sliceParam.column,
                                                                        ),
                                                                    ),
                                                                ),
                                                                factory.createIdentifier(
                                                                    "length",
                                                                ),
                                                            ),
                                                        ],
                                                    ],
                                                    ["keys", []],
                                                    [
                                                        "map",
                                                        [
                                                            factory.createArrowFunction(
                                                                undefined,
                                                                undefined,
                                                                [
                                                                    factory.createParameterDeclaration(
                                                                        undefined,
                                                                        undefined,
                                                                        factory.createIdentifier(
                                                                            "i",
                                                                        ),
                                                                        undefined,
                                                                        undefined,
                                                                        undefined,
                                                                    ),
                                                                ],
                                                                undefined,
                                                                undefined,
                                                                factory.createTemplateExpression(
                                                                    factory.createTemplateHead(
                                                                        "?",
                                                                    ),
                                                                    [
                                                                        factory.createTemplateSpan(
                                                                            factory.createBinaryExpression(
                                                                                factory.createIdentifier(
                                                                                    "i",
                                                                                ),
                                                                                factory.createToken(
                                                                                    SyntaxKind.PlusToken,
                                                                                ),
                                                                                factory.createNumericLiteral(
                                                                                    sliceParam.number -
                                                                                        1 +
                                                                                        1,
                                                                                ),
                                                                            ),
                                                                            factory.createTemplateTail(
                                                                                "",
                                                                            ),
                                                                        ),
                                                                    ],
                                                                ),
                                                            ),
                                                        ],
                                                    ],
                                                ),
                                            ),
                                        ],
                                        true,
                                    ),
                                    "join",
                                    [factory.createStringLiteral(",")],
                                ),
                            ],
                        ),
                    ),
                ],
                NodeFlags.Let,
            ),
        ),
    )

    return { queryIdent, statements }
}

function createDatabaseExecStatement(
    queryName: string,
    params: Parameter[],
    method: "one" | "many" | "exec",
    options?: Options,
) {
    let queryIdent = factory.createIdentifier(queryName)

    let methodIdentifier = "query"
    switch (method) {
        case "one":
            methodIdentifier = "queryOne"
            break
        case "exec":
            methodIdentifier = "exec"
            break
    }

    let bindParams: Expression = factory.createArrayLiteralExpression(
        params.map((param, i) => {
            let override = options?.overrides?.find(
                (o) => param.column && o.column === fullColumName(param.column),
            )

            if (!override || !override.to_sql) {
                let exp = factory.createPropertyAccessExpression(
                    factory.createIdentifier("args"),
                    factory.createIdentifier(argName(i, param.column)),
                )

                if (param.column?.isSqlcSlice) {
                    return factory.createSpreadElement(exp)
                }

                return exp
            }

            return factory.createCallExpression(
                factory.createIdentifier(override.to_sql.fn),
                undefined,
                [
                    factory.createPropertyAccessExpression(
                        factory.createIdentifier("args"),
                        factory.createIdentifier(argName(i, param.column)),
                    ),
                ],
            )
        }),
    )

    return factory.createCallExpression(
        factory.createPropertyAccessExpression(
            factory.createIdentifier("database"),
            factory.createIdentifier(methodIdentifier),
        ),
        undefined,
        [queryIdent, bindParams, factory.createIdentifier("abort")],
    )
}

export function astToString(name: string, nodes: Node[]) {
    let resultFile = createSourceFile(
        name,
        "",
        ScriptTarget.Latest,
        false, // setParentNodes
        ScriptKind.TS,
    )
    let printer = createPrinter({ newLine: NewLineKind.LineFeed })
    let output = "// Code generated by sqlc. DO NOT EDIT.\n\n"
    for (let node of nodes) {
        output += printer.printNode(EmitHint.Unspecified, node, resultFile)
        output += "\n\n"
    }
    return output
}

export function createColumnType(
    column?: Column,
    override?: Override,
): TypeNode {
    if (column === undefined || column.type === undefined) {
        return factory.createKeywordTypeNode(SyntaxKind.AnyKeyword)
    }

    if (override?.type) {
        return factory.createTypeReferenceNode(override?.type)
    }

    let typ: TypeNode = factory.createKeywordTypeNode(SyntaxKind.AnyKeyword)
    switch (column.type.name.toLowerCase()) {
        case "integer":
            typ = factory.createKeywordTypeNode(SyntaxKind.NumberKeyword)
            break
        case "real":
            typ = factory.createKeywordTypeNode(SyntaxKind.NumberKeyword)
            break
        case "boolean":
            typ = factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword)
            break
        case "text":
            typ = factory.createKeywordTypeNode(SyntaxKind.StringKeyword)
            break
        case "date":
        case "datetime":
        case "timestamp": {
            typ = factory.createTypeReferenceNode(
                factory.createIdentifier("Date"),
                undefined,
            )
            break
        }
    }

    if (column.isSqlcSlice) {
        typ = factory.createArrayTypeNode(typ)
    }

    if (column.notNull) {
        return typ
    }

    return factory.createUnionTypeNode([
        typ,
        factory.createLiteralTypeNode(factory.createNull()),
    ])
}

function createProperyCallExp(
    expr: Expression,
    property: string | MemberName,
    args: Expression[],
) {
    return factory.createCallExpression(
        factory.createPropertyAccessExpression(expr, property),
        undefined,
        args,
    )
}

function createCallChain(
    first: [Expression, Expression[]],
    ...chain: [string, Expression[]][]
) {
    let expr: ReturnType<typeof factory.createCallExpression> =
        factory.createCallExpression(first[0], undefined, first[1])
    for (let i = 0; i < chain.length; i++) {
        let curr = chain[i]
        expr = factory.createCallExpression(
            factory.createPropertyAccessExpression(expr, curr[0]),
            undefined,
            curr[1],
        )
    }

    return expr
}

export function fieldName(
    prefix: string,
    index: number,
    column?: Column,
): string {
    let name = `${prefix}_${index}`
    if (column) {
        name = column.name
    }
    return strToCamelCase(name)
}

export function argName(index: number, column?: Column): string {
    return fieldName("arg", index, column)
}

export function columnName(index: number, column?: Column): string {
    return fieldName("col", index, column)
}

export function strToCamelCase(str: string) {
    return str.replace(/([_][a-z])/g, (group) =>
        group.toUpperCase().replace("_", ""),
    )
}

export function fullColumName(column: Column): string {
    if (!column.table) {
        return column.name
    }
    return `${column.table.name}.${column.name}`
}

export function validateQueryColumns(query: Query) {
    let colmap = new Map<string, number>()
    for (let column of query.columns) {
        if (!column.name) {
            continue
        }
        let count = colmap.get(column.name) || 0
        if (count > 0) {
            throw new Error(
                `duplicate column: ${column.name} in query ${query.name}`,
            )
        }
        colmap.set(column.name, count + 1)
    }
}

function findColumn(
    columns?: Column[],
    overrides: Override[] = [],
): Record<string, Override> | undefined {
    if (!columns) {
        return undefined
    }

    if (overrides.length === 0) {
        return undefined
    }

    let overridden: Record<string, Override> = {}

    for (let column of columns) {
        let override = overrides.find((o) => o.column === fullColumName(column))

        if (!override) {
            continue
        }

        overridden[column.name] = override
    }

    return overridden
}
