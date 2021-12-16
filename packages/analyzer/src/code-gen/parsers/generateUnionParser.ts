import ts from "typescript"
import { generatePushErrorExpressionStatement } from "./generateParserLib"
import { generateParserForNode } from "./parsers"
import { TSNode, TSUnionElementNode } from "./TSNode"

export default function generateUnionParser(node: TSNode): ts.Statement {
  if (!ts.isUnionTypeNode(node.typeNode)) {
    throw new Error("Not a union type")
  }

  const saveErrors = saveErrorsLengthBeforeUnionValidation()
  const errorFallback = generatePushErrorExpressionStatement(
    node.errorPath,
    `is none of the options of union`,
  )

  const validateUnionMembers = node.typeNode.types.reduceRight(
    (st: ts.Statement, nodeType: ts.TypeNode) => {
      const unionNode = new TSUnionElementNode(nodeType, node.typeChecker, node)
      return ts.factory.createBlock([
        generateParserForNode(unionNode),
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
