import ts from "typescript"
import { ParseError } from "../domain/errors"

export default function parseReturnType(
  node: ts.FunctionLikeDeclarationBase,
): ts.TypeNode {
  const typeNode: ts.TypeNode | undefined = node.type

  if (!typeNode) {
    throw new ParseError("S121: Return type should be explicitly defined", node)
  }

  if (ts.isTypeReferenceNode(typeNode)) {
    const promisedType = typeNode.typeArguments?.[0]
    if (typeNode.typeName.getText() === "Promise" && promisedType) {
      return promisedType
    }
  }

  throw new ParseError("S122: Return type should be a Promise<T>", typeNode)
}
