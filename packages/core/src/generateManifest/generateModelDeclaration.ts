import ts from "typescript"
import { ParseError } from "../errors"
import { Model, PheroModel } from "../parsePheroApp/domain"

// const exportModifier = ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)

export default function generateModelDeclaration(
  pheroModel: PheroModel,
): Model {
  const model = pheroModel.ref
  if (ts.isTypeAliasDeclaration(model)) {
    return ts.factory.createTypeAliasDeclaration(
      undefined,
      model.name,
      model.typeParameters?.map((tp) =>
        ts.factory.createTypeParameterDeclaration(
          undefined,
          tp.name,
          tp.constraint && generateTypeNode(tp.constraint),
          tp.default && generateTypeNode(tp.default),
        ),
      ),
      generateTypeNode(model.type),
    )
  } else if (ts.isInterfaceDeclaration(model)) {
    return ts.factory.createInterfaceDeclaration(
      undefined,
      model.name,
      model.typeParameters?.map((tp) =>
        ts.factory.createTypeParameterDeclaration(
          undefined,
          tp.name,
          tp.constraint && generateTypeNode(tp.constraint),
          tp.default && generateTypeNode(tp.default),
        ),
      ),
      model.heritageClauses?.map((hc) =>
        ts.factory.createHeritageClause(
          hc.token,
          hc.types.map((t) => {
            return ts.factory.createExpressionWithTypeArguments(
              ts.isIdentifier(t.expression)
                ? ts.factory.createIdentifier(t.expression.text)
                : ts.isPropertyAccessExpression(t.expression) &&
                  ts.isIdentifier(t.expression.name)
                ? ts.factory.createIdentifier(t.expression.name.text)
                : t.expression,
              t.typeArguments?.map(generateTypeNode),
            )
          }),
        ),
      ),
      model.members.map((m) => generateTypeElement(m)),
    )
  } else if (ts.isEnumDeclaration(model)) {
    return ts.factory.createEnumDeclaration(
      undefined,
      model.name,
      model.members.map((member) => {
        return ts.factory.createEnumMember(
          generatePropertyName(member.name),
          member.initializer &&
            (ts.isStringLiteral(member.initializer)
              ? ts.factory.createStringLiteral(member.initializer.text)
              : ts.isNumericLiteral(member.initializer)
              ? ts.factory.createNumericLiteral(member.initializer.text)
              : undefined),
        )
      }),
    )
  }

  return model
}

function generatePropertyName(propName: ts.PropertyName): ts.PropertyName {
  if (ts.isIdentifier(propName)) {
    return ts.factory.createIdentifier(propName.text)
  } else if (ts.isStringLiteral(propName)) {
    return ts.factory.createStringLiteral(propName.text)
  } else if (ts.isNumericLiteral(propName)) {
    return ts.factory.createNumericLiteral(propName.text)
  }
  // else if (ts.isComputedPropertyName(propName)) {
  // } else if (ts.isPrivateIdentifier(propName)) {
  // }
  throw new ParseError(
    "S101: We currently do not support these kind of property names",
    propName,
  )
}

function generateTypeNode(type: ts.TypeNode): ts.TypeNode {
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

function generateTypeElement(typeElement: ts.TypeElement): ts.TypeElement {
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
