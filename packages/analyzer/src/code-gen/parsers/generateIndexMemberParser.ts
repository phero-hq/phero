import ts from "typescript"
import { generateKeyValidator } from "./generateKeyValidator"
import generateParserFromModel from "./generateParserFromModel"
import { IndexMemberParserModel } from "./generateParserModel"
import Pointer from "./Pointer"

export default function generateIndexMemberParser(
  pointer: Pointer<IndexMemberParserModel>,
): ts.Statement {
  const valueParser = generateParserFromModel(
    pointer.model.parser,
    pointer.path,
  )

  const indexMemberParser = generateDynamicMemberLoop(
    pointer,
    ts.factory.createBlock([]),
    valueParser,
  )

  if (pointer.model.optional) {
    return ts.factory.createIfStatement(
      ts.factory.createBinaryExpression(
        pointer.dataVarExpr,
        ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
        ts.factory.createIdentifier("undefined"),
      ),
      indexMemberParser,
    )
  }

  return indexMemberParser
}

function generateDynamicMemberLoop(
  pointer: Pointer<IndexMemberParserModel>,
  keyParser: ts.Statement,
  valueParser: ts.Statement,
) {
  const depth = pointer.model.depth
  return ts.factory.createForStatement(
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier(`itk_${depth}`),
          undefined,
          undefined,
          ts.factory.createNumericLiteral("0"),
        ),
        ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier("keys"),
          undefined,
          undefined,
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier("Object"),
              ts.factory.createIdentifier("keys"),
            ),
            undefined,
            [pointer.parentVarExpr],
          ),
        ),
      ],
      ts.NodeFlags.Let,
    ),
    ts.factory.createBinaryExpression(
      ts.factory.createIdentifier(`itk_${depth}`),
      ts.factory.createToken(ts.SyntaxKind.LessThanToken),
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier("keys"),
        ts.factory.createIdentifier("length"),
      ),
    ),
    ts.factory.createPostfixUnaryExpression(
      ts.factory.createIdentifier(`itk_${depth}`),
      ts.SyntaxKind.PlusPlusToken,
    ),
    ts.factory.createBlock(
      [
        ts.factory.createVariableStatement(
          undefined,
          ts.factory.createVariableDeclarationList(
            [
              ts.factory.createVariableDeclaration(
                ts.factory.createIdentifier(`it_${pointer.model.depth}`),
                undefined,
                undefined,
                ts.factory.createElementAccessExpression(
                  ts.factory.createIdentifier("keys"),
                  ts.factory.createIdentifier(`itk_${depth}`),
                ),
              ),
            ],
            ts.NodeFlags.Const,
          ),
        ),
        ts.factory.createIfStatement(
          generateKeyValidator(
            pointer.model.keyParser,
            ts.factory.createIdentifier(`it_${pointer.model.depth}`),
          ),
          ts.factory.createContinueStatement(undefined),
          valueParser,
        ),
      ],
      true,
    ),
  )
}
