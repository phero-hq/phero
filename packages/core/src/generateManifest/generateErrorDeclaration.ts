import ts from "typescript"
import { PheroError } from "../domain/PheroApp"
import * as tsx from "../tsx"

export default function generateErrorDeclaration(
  error: PheroError,
): ts.ClassDeclaration {
  return tsx.classDeclaration({
    name: error.name,
    export: true,
    extendsType: ts.factory.createExpressionWithTypeArguments(
      tsx.expression.identifier("Error"),
      undefined,
    ),
    constructor: tsx.constructor({
      params: [
        tsx.param({
          // public: true,
          // readonly: true,
          name: "message",
          type: tsx.type.string,
        }),
        ...error.properties.map((prop) =>
          tsx.param({
            // public: true,
            // readonly: true,
            name: prop.name,
            type: prop.type,
          }),
        ),
      ],
    }),
  })
}
