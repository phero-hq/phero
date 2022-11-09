import ts from "typescript"
import { PheroError } from "../parsePheroApp/domain"
import * as tsx from "../tsx"

export default function generateErrorDeclaration(
  error: PheroError,
): ts.ClassDeclaration {
  return tsx.classDeclaration({
    name: error.name,
    extendsType: ts.factory.createExpressionWithTypeArguments(
      tsx.expression.identifier("Error"),
      undefined,
    ),
    constructor: tsx.constructor({
      params: error.properties.map((prop) =>
        tsx.param({
          // public: true,
          // readonly: true,
          name: prop.name,
          type: prop.type,
        }),
      ),
    }),
  })
}
