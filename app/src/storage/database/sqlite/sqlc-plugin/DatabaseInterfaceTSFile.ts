import { type Node, SyntaxKind, factory } from "typescript"

// @ts-expect-error: extension is required when running TS files with Node
import { astToString } from "./utils.ts"

export class DatabaseInterfaceTSFile {
    readonly name: string = "db.ts"
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
            databaseInterfaceDeclaration,
        )
    }
}

const databaseInterfaceDeclaration = factory.createInterfaceDeclaration(
    [factory.createToken(SyntaxKind.ExportKeyword)],
    factory.createIdentifier("Database"),
    undefined,
    undefined,
    [
        factory.createPropertySignature(
            undefined,
            factory.createIdentifier("exec"),
            undefined,
            factory.createFunctionTypeNode(
                undefined,
                [
                    factory.createParameterDeclaration(
                        undefined,
                        undefined,
                        factory.createIdentifier("sql"),
                        undefined,
                        factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
                        undefined,
                    ),

                    factory.createParameterDeclaration(
                        undefined,
                        undefined,
                        factory.createIdentifier("args"),
                        factory.createToken(SyntaxKind.QuestionToken),
                        factory.createArrayTypeNode(
                            factory.createUnionTypeNode([
                                factory.createTypeReferenceNode(
                                    factory.createIdentifier("SqlValue"),
                                    undefined,
                                ),
                                factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword),
                            ]),
                        ),
                        undefined,
                    ),

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
                ],
                factory.createTypeReferenceNode(factory.createIdentifier("Promise"), [
                    factory.createKeywordTypeNode(SyntaxKind.NumberKeyword),
                ]),
            ),
        ),

        factory.createPropertySignature(
            undefined,
            factory.createIdentifier("query"),
            undefined,
            factory.createFunctionTypeNode(
                [
                    factory.createTypeParameterDeclaration(
                        undefined,
                        "R",
                        factory.createTypeReferenceNode("Record", [
                            factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
                            factory.createUnionTypeNode([
                                factory.createTypeReferenceNode(
                                    factory.createIdentifier("SqlValue"),
                                    undefined,
                                ),
                                factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword),
                            ]),
                        ]),
                    ),
                ],
                [
                    factory.createParameterDeclaration(
                        undefined,
                        undefined,
                        factory.createIdentifier("sql"),
                        undefined,
                        factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
                        undefined,
                    ),

                    factory.createParameterDeclaration(
                        undefined,
                        undefined,
                        factory.createIdentifier("args"),
                        factory.createToken(SyntaxKind.QuestionToken),
                        factory.createArrayTypeNode(
                            factory.createUnionTypeNode([
                                factory.createTypeReferenceNode(
                                    factory.createIdentifier("SqlValue"),
                                    undefined,
                                ),
                                factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword),
                            ]),
                        ),
                        undefined,
                    ),

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
                ],
                factory.createTypeReferenceNode(factory.createIdentifier("Promise"), [
                    factory.createArrayTypeNode(
                        factory.createTypeReferenceNode(factory.createIdentifier("R"), undefined),
                    ),
                ]),
            ),
        ),

        factory.createPropertySignature(
            undefined,
            factory.createIdentifier("queryOne"),
            undefined,
            factory.createFunctionTypeNode(
                [
                    factory.createTypeParameterDeclaration(
                        undefined,
                        "R",
                        factory.createTypeReferenceNode("Record", [
                            factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
                            factory.createUnionTypeNode([
                                factory.createTypeReferenceNode(
                                    factory.createIdentifier("SqlValue"),
                                    undefined,
                                ),
                                factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword),
                            ]),
                        ]),
                    ),
                ],
                [
                    factory.createParameterDeclaration(
                        undefined,
                        undefined,
                        factory.createIdentifier("sql"),
                        undefined,
                        factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
                        undefined,
                    ),

                    factory.createParameterDeclaration(
                        undefined,
                        undefined,
                        factory.createIdentifier("args"),
                        factory.createToken(SyntaxKind.QuestionToken),
                        factory.createArrayTypeNode(
                            factory.createUnionTypeNode([
                                factory.createTypeReferenceNode(
                                    factory.createIdentifier("SqlValue"),
                                    undefined,
                                ),
                                factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword),
                            ]),
                        ),
                        undefined,
                    ),

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
                ],
                factory.createTypeReferenceNode(factory.createIdentifier("Promise"), [
                    factory.createUnionTypeNode([
                        factory.createTypeReferenceNode(factory.createIdentifier("R"), undefined),
                        factory.createKeywordTypeNode(SyntaxKind.UndefinedKeyword),
                    ]),
                ]),
            ),
        ),
    ],
)
