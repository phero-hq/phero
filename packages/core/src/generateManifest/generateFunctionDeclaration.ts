import ts from "typescript"
import { PheroFunction } from "../domain/PheroApp"
import cloneTS from "../lib/cloneTS"
import * as tsx from "../tsx"

export default function generateFunctionDeclaration(
  func: PheroFunction,
): ts.FunctionDeclaration {
  return tsx.function({
    name: func.name,
    params: [
      ...(func.contextParameterType
        ? [
            tsx.param({
              name: "context",
              type: tsx.type.reference({
                name: "phero.PheroContext",
                args: [cloneTS(func.contextParameterType)],
              }),
            }),
          ]
        : []),
      ...func.parameters.map((param) =>
        tsx.param({
          name: param.name,
          questionToken: param.questionToken,
          type: cloneTS(param.type),
        }),
      ),
    ],
    returnType: tsx.type.reference({
      name: "Promise",
      args: [cloneTS(func.returnType)],
    }),
  })
}
