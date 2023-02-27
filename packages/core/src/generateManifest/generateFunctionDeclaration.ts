import ts from "typescript"
import { PheroFunction } from "../domain/PheroApp"
import cloneTS from "../lib/cloneTS"
import * as tsx from "../tsx"

export default function generateFunctionDeclaration(
  func: PheroFunction,
): ts.MethodDeclaration {
  return tsx.method({
    name: func.name,
    params: func.parameters.map((param) =>
      tsx.param({
        name: param.name,
        questionToken: param.questionToken,
        type: cloneTS(param.type),
      }),
    ),
    returnType: tsx.type.reference({
      name: "Promise",
      args: [cloneTS(func.returnType)],
    }),
  })
}
