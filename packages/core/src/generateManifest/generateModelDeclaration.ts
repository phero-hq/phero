import ts from "typescript"
import { ParseError } from "../domain/errors"
import { generateTypeNode, generateTypeElement } from "../lib/generateTypeNode"
import { Model, PheroModel } from "../parsePheroApp/domain"

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
