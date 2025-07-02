import {
    type Expression,
    type FunctionDeclaration,
    NodeFlags,
    SyntaxKind,
    type TypeNode,
    factory,
} from "typescript"

import type { Column, Parameter, Query } from "./proto/codegen_pb"

export class WasmSQLite3Driver {
    columnType(column?: Column): TypeNode {
        if (column === undefined || column.type === undefined) {
            return factory.createKeywordTypeNode(SyntaxKind.AnyKeyword)
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
                typ = factory.createTypeReferenceNode(factory.createIdentifier("Date"), undefined)
                break
            }
        }

        if (column.notNull) {
            return typ
        }

        return factory.createUnionTypeNode([
            typ,
            factory.createLiteralTypeNode(factory.createNull()),
        ])
    }

    preamble(_: Query[]) {
        let imports = factory.createImportDeclaration(
            undefined,
            factory.createImportClause(
                true,
                undefined,
                factory.createNamedImports([
                    factory.createImportSpecifier(
                        false,
                        undefined,
                        factory.createIdentifier("Database"),
                    ),
                    factory.createImportSpecifier(
                        false,
                        undefined,
                        factory.createIdentifier("SqlValue"),
                    ),
                ]),
            ),
            factory.createStringLiteral("@sqlite.org/sqlite-wasm"),
            undefined,
        )

        let columnNameToFieldName = factory.createFunctionDeclaration(
            undefined, // modifiers
            undefined, // asteriskToken
            factory.createIdentifier("columnNameToFieldName"),
            undefined, // typeParameters
            [
                factory.createParameterDeclaration(
                    undefined, // modifiers
                    undefined, // dotDotDotToken
                    factory.createIdentifier("column"), // name
                    undefined, // questionToken
                    factory.createKeywordTypeNode(SyntaxKind.StringKeyword), // type
                    undefined, // initializer
                ),
            ], // parameters
            undefined, // type
            factory.createBlock(
                [
                    factory.createReturnStatement(
                        factory.createCallExpression(
                            factory.createPropertyAccessExpression(
                                factory.createCallExpression(
                                    factory.createPropertyAccessExpression(
                                        factory.createIdentifier("column"),
                                        factory.createIdentifier("toLowerCase"),
                                    ),
                                    undefined,
                                    undefined,
                                ),
                                factory.createIdentifier("replace"),
                            ),
                            undefined,
                            [
                                factory.createRegularExpressionLiteral("/([_][a-z])/g"),
                                factory.createArrowFunction(
                                    undefined, // modifiers
                                    undefined, // typeParameters
                                    [
                                        factory.createParameterDeclaration(
                                            undefined, // modifiers
                                            undefined, // dotDotDotToken
                                            factory.createIdentifier("group"), // name
                                            undefined, // questionToken
                                            undefined, // type
                                            undefined, // initializer
                                        ),
                                    ],
                                    undefined, // type
                                    undefined, // equalsGreaterThanToken
                                    factory.createCallExpression(
                                        factory.createPropertyAccessExpression(
                                            factory.createCallExpression(
                                                factory.createPropertyAccessExpression(
                                                    factory.createIdentifier("group"),
                                                    factory.createIdentifier("toUpperCase"),
                                                ),
                                                undefined,
                                                undefined,
                                            ),
                                            factory.createIdentifier("replace"),
                                        ),
                                        undefined,
                                        [
                                            factory.createStringLiteral("_"),
                                            factory.createStringLiteral(""),
                                        ],
                                    ),
                                ),
                            ],
                        ),
                    ),
                ],
                true,
            ),
        )

        let mapRowToObjFuncDecl = factory.createFunctionDeclaration(
            undefined, // modifiers
            undefined, // asteriskToken
            factory.createIdentifier("mapRowToObj"),
            [
                factory.createTypeParameterDeclaration(
                    undefined,
                    "T",
                    factory.createKeywordTypeNode(SyntaxKind.ObjectKeyword),
                ),
            ], // typeParameters
            [
                factory.createParameterDeclaration(
                    undefined, // modifiers
                    undefined, // dotDotDotToken
                    factory.createIdentifier("row"), // name
                    undefined, // questionToken
                    factory.createTypeReferenceNode("Record", [
                        factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
                        factory.createTypeReferenceNode("SqlValue"),
                    ]), // type
                    undefined, // initializer
                ),
            ], // parameters
            factory.createTypeReferenceNode("T"), // type
            factory.createBlock(
                [
                    factory.createVariableStatement(
                        undefined,
                        factory.createVariableDeclarationList(
                            [
                                factory.createVariableDeclaration(
                                    "obj",
                                    undefined,
                                    undefined,
                                    factory.createAsExpression(
                                        factory.createObjectLiteralExpression(undefined),
                                        factory.createTypeReferenceNode("T", undefined),
                                    ),
                                ),
                            ],
                            NodeFlags.Let | NodeFlags.TypeExcludesFlags,
                        ),
                    ),
                    factory.createForInStatement(
                        factory.createVariableDeclarationList(
                            [
                                factory.createVariableDeclaration(
                                    factory.createIdentifier("key"),
                                    undefined,
                                    undefined,
                                    undefined,
                                ),
                            ],
                            NodeFlags.Let | NodeFlags.TypeExcludesFlags,
                        ),
                        factory.createIdentifier("row"),
                        factory.createBlock(
                            [
                                factory.createVariableStatement(
                                    undefined,
                                    factory.createVariableDeclarationList(
                                        [
                                            factory.createVariableDeclaration(
                                                factory.createIdentifier("field"),
                                                undefined,
                                                undefined,
                                                factory.createAsExpression(
                                                    factory.createCallExpression(
                                                        factory.createIdentifier(
                                                            "columnNameToFieldName",
                                                        ),
                                                        undefined,
                                                        [factory.createIdentifier("key")],
                                                    ),
                                                    factory.createTypeOperatorNode(
                                                        SyntaxKind.KeyOfKeyword,
                                                        factory.createTypeReferenceNode(
                                                            "T",
                                                            undefined,
                                                        ),
                                                    ),
                                                ),
                                            ),
                                        ],
                                        NodeFlags.Let | NodeFlags.TypeExcludesFlags,
                                    ),
                                ),

                                factory.createExpressionStatement(
                                    factory.createAssignment(
                                        factory.createParenthesizedExpression(
                                            factory.createAsExpression(
                                                factory.createElementAccessChain(
                                                    factory.createIdentifier("obj"),
                                                    undefined,
                                                    factory.createIdentifier("field"),
                                                ),
                                                factory.createIndexedAccessTypeNode(
                                                    factory.createTypeReferenceNode("T", undefined),
                                                    factory.createTypeQueryNode(
                                                        factory.createIdentifier("field"),
                                                        undefined,
                                                    ),
                                                ),
                                            ),
                                        ),
                                        factory.createAsExpression(
                                            factory.createElementAccessChain(
                                                factory.createIdentifier("row"),
                                                undefined,
                                                factory.createIdentifier("key"),
                                            ),
                                            factory.createIndexedAccessTypeNode(
                                                factory.createTypeReferenceNode("T", undefined),
                                                factory.createTypeQueryNode(
                                                    factory.createIdentifier("field"),
                                                    undefined,
                                                ),
                                            ),
                                        ),
                                    ),
                                ),
                            ],
                            true,
                        ),
                    ),
                    factory.createReturnStatement(factory.createIdentifier("obj")),
                ],
                true,
            ),
        )

        return [imports, columnNameToFieldName, mapRowToObjFuncDecl]
    }

    execDecl(
        funcName: string,
        queryName: string,
        argIface: string | undefined,
        params: Parameter[],
    ) {
        let funcParams = funcParamsDecl(argIface, params)

        return factory.createFunctionDeclaration(
            [factory.createToken(SyntaxKind.ExportKeyword)],
            undefined,
            factory.createIdentifier(funcName),
            undefined,
            funcParams,
            undefined,
            factory.createBlock(
                [
                    factory.createExpressionStatement(
                        createDatabaseExecStatement(queryName, params, "exec"),
                    ),
                ],
                true,
            ),
        )
    }

    oneDecl(
        funcName: string,
        queryName: string,
        argIface: string | undefined,
        returnIface: string,
        params: Parameter[],
        _columns: Column[],
    ) {
        let funcParams = funcParamsDecl(argIface, params)

        return factory.createFunctionDeclaration(
            [factory.createToken(SyntaxKind.ExportKeyword)],
            undefined,
            factory.createIdentifier(funcName),
            undefined,
            funcParams,
            factory.createUnionTypeNode([
                factory.createTypeReferenceNode(factory.createIdentifier(returnIface), undefined),
                factory.createLiteralTypeNode(factory.createNull()),
            ]),
            factory.createBlock(
                [
                    factory.createVariableStatement(
                        undefined,
                        factory.createVariableDeclarationList(
                            [
                                factory.createVariableDeclaration(
                                    factory.createIdentifier("result"),
                                    undefined,
                                    undefined,
                                    createDatabaseExecStatement(queryName, params, "one"),
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
                            [factory.createIdentifier("result")],
                        ),
                    ),
                ],
                true,
            ),
        )
    }

    manyDecl(
        funcName: string,
        queryName: string,
        argIface: string | undefined,
        returnIface: string,
        params: Parameter[],
        _columns: Column[],
    ) {
        let funcParams = funcParamsDecl(argIface, params)

        return factory.createFunctionDeclaration(
            [factory.createToken(SyntaxKind.ExportKeyword)],
            undefined,
            factory.createIdentifier(funcName),
            undefined,
            funcParams,
            factory.createArrayTypeNode(
                factory.createTypeReferenceNode(factory.createIdentifier(returnIface), undefined),
            ),
            factory.createBlock(
                [
                    factory.createVariableStatement(
                        undefined,
                        factory.createVariableDeclarationList(
                            [
                                factory.createVariableDeclaration(
                                    factory.createIdentifier("result"),
                                    undefined,
                                    undefined,
                                    createDatabaseExecStatement(queryName, params, "many"),
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
                                        undefined,
                                        [factory.createIdentifier("row")],
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

    execlastidDecl(
        _funcName: string,
        _queryName: string,
        _argIface: string | undefined,
        _params: Parameter[],
    ): FunctionDeclaration {
        throw new Error("sqlite3-wasm driver currently does not support :execlastid")
    }

    execrowsDecl(
        funcName: string,
        queryName: string,
        argIface: string | undefined,
        params: Parameter[],
    ) {
        let funcParams = funcParamsDecl(argIface, params)

        return factory.createFunctionDeclaration(
            [factory.createToken(SyntaxKind.ExportKeyword)],
            undefined,
            factory.createIdentifier(funcName),
            undefined,
            funcParams,
            undefined,
            factory.createBlock(
                [
                    factory.createReturnStatement(
                        factory.createCallExpression(
                            factory.createPropertyAccessExpression(
                                createDatabaseExecStatement(queryName, params, "exec"),
                                factory.createIdentifier("changes"),
                            ),
                            undefined,
                            undefined,
                        ),
                    ),
                ],
                true,
            ),
        )
    }
}

function funcParamsDecl(iface: string | undefined, params: Parameter[]) {
    let funcParams = [
        factory.createParameterDeclaration(
            undefined,
            undefined,
            factory.createIdentifier("database"),
            undefined,
            factory.createTypeReferenceNode(factory.createIdentifier("Database"), undefined),
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
                factory.createTypeReferenceNode(factory.createIdentifier(iface), undefined),
                undefined,
            ),
        )
    }

    return funcParams
}

// https://stackoverflow.com/questions/40710628/how-to-convert-snake-case-to-camelcase
export function fieldName(prefix: string, index: number, column?: Column): string {
    let name = `${prefix}_${index}`
    if (column) {
        name = column.name
    }
    return strToCamelCase(name)
}

export function argName(index: number, column?: Column): string {
    return fieldName("arg", index, column)
}

export function colName(index: number, column?: Column): string {
    return fieldName("col", index, column)
}

export function strToCamelCase(str: string) {
    return str.replace(/([_][a-z])/g, (group) => group.toUpperCase().replace("_", ""))
}

function createDatabaseExecStatement(
    queryName: string,
    params: Parameter[],
    method: "one" | "many" | "exec",
) {
    let methodIdentifier = "selectObjects"
    switch (method) {
        case "one":
            methodIdentifier = "selectObject"
            break
        case "exec":
            methodIdentifier = "exec"
            break
    }

    let bindParams: Expression = factory.createArrayLiteralExpression(
        params.map((param, i) =>
            factory.createPropertyAccessExpression(
                factory.createIdentifier("args"),
                factory.createIdentifier(argName(i, param.column)),
            ),
        ),
    )

    if (methodIdentifier === "exec") {
        bindParams = factory.createObjectLiteralExpression([
            factory.createPropertyAssignment("bind", bindParams),
        ])
    }

    return factory.createCallExpression(
        factory.createPropertyAccessExpression(
            factory.createIdentifier("database"),
            factory.createIdentifier(methodIdentifier),
        ),
        undefined,
        [factory.createIdentifier(queryName), bindParams],
    )
}
