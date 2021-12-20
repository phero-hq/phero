import ts from "typescript"
import { generateParserFromModel, NewPointer } from "./generateParserFromModel"
import { generatePushErrorExpressionStatement } from "./generateParserLib"
import { ParserModel, UnionParserModel } from "./generateParserModel"

export default function generateUnionParser(
  pointer: NewPointer<UnionParserModel>,
): ts.Statement {
  const saveErrors = saveErrorsLengthBeforeUnionValidation()
  const errorFallback = generatePushErrorExpressionStatement(
    pointer.errorPath,
    `is none of the options of union`,
  )

  const validateUnionMembers = pointer.model.oneOf.reduceRight(
    (st: ts.Statement, element: ParserModel) => {
      return ts.factory.createBlock([
        generateParserFromModel(element, pointer.path),
        validateOrNext(st),
      ])
    },
    errorFallback,
  )

  return ts.factory.createBlock([saveErrors, validateUnionMembers])
}

function saveErrorsLengthBeforeUnionValidation(): ts.Statement {
  return ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier("errLength"),
          undefined,
          undefined,
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier("errors"),
            ts.factory.createIdentifier("length"),
          ),
        ),
      ],
      ts.NodeFlags.Const,
    ),
  )
}

function validateOrNext(nextValidationStatement: ts.Statement): ts.Statement {
  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier("errors"),
        ts.factory.createIdentifier("length"),
      ),
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createIdentifier("errLength"),
    ),
    ts.factory.createBlock([resetErrors(), nextValidationStatement]),
  )
}

function resetErrors(): ts.Statement {
  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier("errors"),
        ts.factory.createIdentifier("splice"),
      ),
      undefined,
      [
        ts.factory.createIdentifier("errLength"),
        ts.factory.createBinaryExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier("errors"),
            ts.factory.createIdentifier("length"),
          ),
          ts.factory.createToken(ts.SyntaxKind.MinusToken),
          ts.factory.createIdentifier("errLength"),
        ),
      ],
    ),
  )
}
