import ts from "typescript"
import { ParseError } from "../domain/errors"

export function generateTypeNode(type: ts.TypeNode): ts.TypeNode {
  if (ts.isTypeReferenceNode(type)) {
    return ts.factory.createTypeReferenceNode(
      ts.isIdentifier(type.typeName) ? type.typeName : type.typeName.right,
      type.typeArguments?.map(generateTypeNode),
    )
  }
  if (ts.isLiteralTypeNode(type)) {
    if (ts.isStringLiteral(type.literal)) {
      return ts.factory.createLiteralTypeNode(
        ts.factory.createStringLiteral(type.literal.text),
      )
    } else if (ts.isNumericLiteral(type.literal)) {
      return ts.factory.createLiteralTypeNode(
        ts.factory.createNumericLiteral(type.literal.text),
      )
    }
  }
  if (ts.isUnionTypeNode(type)) {
    return ts.factory.createUnionTypeNode(type.types.map(generateTypeNode))
  }
  if (ts.isIntersectionTypeNode(type)) {
    return ts.factory.createIntersectionTypeNode(
      type.types.map(generateTypeNode),
    )
  }

  if (ts.isTypeLiteralNode(type)) {
    return ts.factory.createTypeLiteralNode(
      type.members.map(generateTypeElement),
    )
  }

  if (ts.isArrayTypeNode(type)) {
    return ts.factory.createArrayTypeNode(generateTypeNode(type.elementType))
  }

  if (ts.isIndexedAccessTypeNode(type)) {
    return ts.factory.createIndexedAccessTypeNode(
      generateTypeNode(type.objectType),
      generateTypeNode(type.indexType),
    )
  }

  if (ts.isTupleTypeNode(type)) {
    return ts.factory.createTupleTypeNode(type.elements.map(generateTypeNode))
  }

  return type
}

export function generateTypeElement(
  typeElement: ts.TypeElement,
): ts.TypeElement {
  if (ts.isPropertySignature(typeElement)) {
    return ts.factory.createPropertySignature(
      typeElement.modifiers,
      typeElement.name,
      typeElement.questionToken,
      typeElement.type && generateTypeNode(typeElement.type),
    )
  }

  if (ts.isIndexSignatureDeclaration(typeElement)) {
    return ts.factory.createIndexSignature(
      typeElement.modifiers,
      typeElement.parameters.map((p) =>
        ts.factory.createParameterDeclaration(
          p.modifiers,
          p.dotDotDotToken,
          p.name,
          p.questionToken,
          p.type && generateTypeNode(p.type),
          p.initializer,
        ),
      ),
      generateTypeNode(typeElement.type),
    )
  }

  throw new ParseError(
    `S102: We currently do not support this syntax (${typeElement.kind})`,
    typeElement,
  )
}
