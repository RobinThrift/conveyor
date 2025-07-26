import { factory, type Node, NodeFlags, SyntaxKind } from "typescript"

// @ts-expect-error: extension is required when running TS files with Node
import { astToString } from "./utils.ts"

export class UtilsTSFile {
    readonly name: string = "utils.ts"
    private nodes: Node[] = []

    constructor() {
        this.generate()
    }

    public toString() {
        return astToString(this.name, this.nodes)
    }

    private generate() {
        this.nodes.push(
            factory.createImportDeclaration(
                undefined,
                factory.createImportClause(
                    true,
                    undefined,
                    factory.createNamedImports([
                        factory.createImportSpecifier(
                            false,
                            undefined,
                            factory.createIdentifier("SqlValue"),
                        ),
                    ]),
                ),
                factory.createStringLiteral("@sqlite.org/sqlite-wasm"),
                undefined,
            ),
            columnNameToFieldNameFuncDecl,
            mapRowToObjFuncDecl,
            numberToBoolFuncionmDecl,
        )
    }
}

const columnNameToFieldNameFuncDecl = factory.createFunctionDeclaration(
    [factory.createToken(SyntaxKind.ExportKeyword)],
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
                                [factory.createStringLiteral("_"), factory.createStringLiteral("")],
                            ),
                        ),
                    ],
                ),
            ),
        ],
        true,
    ),
)

const mapRowToObjFuncDecl = factory.createFunctionDeclaration(
    [factory.createToken(SyntaxKind.ExportKeyword)],
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
                factory.createUnionTypeNode([
                    factory.createTypeReferenceNode(
                        factory.createIdentifier("SqlValue"),
                        undefined,
                    ),
                    factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword),
                ]),
            ]), // type
            undefined, // initializer
        ),
        factory.createParameterDeclaration(
            undefined, // modifiers
            undefined, // dotDotDotToken
            factory.createIdentifier("overrides"), // name
            undefined, // questionToken
            factory.createTypeReferenceNode("Partial", [
                factory.createTypeReferenceNode("Record", [
                    factory.createTypeOperatorNode(
                        SyntaxKind.KeyOfKeyword,
                        factory.createTypeReferenceNode("T", undefined),
                    ),
                    factory.createFunctionTypeNode(
                        undefined,
                        [
                            factory.createParameterDeclaration(
                                undefined, // modifiers
                                undefined, // dotDotDotToken
                                factory.createIdentifier("v"), // name
                                undefined, // questionToken
                                factory.createKeywordTypeNode(SyntaxKind.AnyKeyword), // type
                                undefined, // initializer
                            ),
                        ],
                        factory.createKeywordTypeNode(SyntaxKind.AnyKeyword),
                    ),
                ]),
            ]), // type
            factory.createObjectLiteralExpression([]), // initializer
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
                                                factory.createIdentifier("columnNameToFieldName"),
                                                undefined,
                                                [factory.createIdentifier("key")],
                                            ),
                                            factory.createTypeOperatorNode(
                                                SyntaxKind.KeyOfKeyword,
                                                factory.createTypeReferenceNode("T", undefined),
                                            ),
                                        ),
                                    ),
                                ],
                                NodeFlags.Let | NodeFlags.TypeExcludesFlags,
                            ),
                        ),

                        factory.createVariableStatement(
                            undefined,
                            factory.createVariableDeclarationList(
                                [
                                    factory.createVariableDeclaration(
                                        factory.createIdentifier("value"),
                                        undefined,
                                        undefined,
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
                                ],
                                NodeFlags.Let | NodeFlags.TypeExcludesFlags,
                            ),
                        ),

                        factory.createIfStatement(
                            factory.createElementAccessChain(
                                factory.createIdentifier("overrides"),
                                undefined,
                                factory.createIdentifier("field"),
                            ),
                            factory.createBlock(
                                [
                                    factory.createExpressionStatement(
                                        factory.createAssignment(
                                            factory.createIdentifier("value"),
                                            factory.createCallExpression(
                                                factory.createElementAccessChain(
                                                    factory.createIdentifier("overrides"),
                                                    undefined,
                                                    factory.createIdentifier("field"),
                                                ),
                                                undefined,
                                                [factory.createIdentifier("value")],
                                            ),
                                        ),
                                    ),
                                ],
                                true,
                            ),
                            undefined,
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
                                factory.createIdentifier("value"),
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

const numberToBoolFuncionmDecl = factory.createFunctionDeclaration(
    [factory.createToken(SyntaxKind.ExportKeyword)],
    undefined, // asteriskToken
    factory.createIdentifier("numberToBool"),
    undefined, // typeParameters
    [
        factory.createParameterDeclaration(
            undefined, // modifiers
            undefined, // dotDotDotToken
            factory.createIdentifier("value"), // name
            undefined, // questionToken
            factory.createKeywordTypeNode(SyntaxKind.NumberKeyword), // type
            undefined, // initializer
        ),
    ], // parameters
    undefined, // type
    factory.createBlock(
        [
            factory.createReturnStatement(
                factory.createBinaryExpression(
                    factory.createIdentifier("value"),
                    factory.createToken(SyntaxKind.EqualsEqualsEqualsToken),
                    factory.createNumericLiteral(1),
                ),
            ),
        ],
        true,
    ),
)
