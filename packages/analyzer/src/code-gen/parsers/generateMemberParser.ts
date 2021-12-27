import ts from "typescript"
import generateParserFromModel from "./generateParserFromModel"
import { MemberParserModel } from "./generateParserModel"
import Pointer from "./Pointer"

export default function generateMemberParser(
  pointer: Pointer<MemberParserModel>,
): ts.Statement {
  const memberParser = generateParserFromModel(
    pointer.model.parser,
    pointer.path,
  )

  if (pointer.model.optional) {
    return ts.factory.createIfStatement(
      ts.factory.createBinaryExpression(
        pointer.dataVarExpr,
        ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
        ts.factory.createIdentifier("undefined"),
      ),
      memberParser,
    )
  }

  return memberParser
}
