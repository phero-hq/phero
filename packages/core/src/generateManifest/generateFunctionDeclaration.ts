import type ts from "typescript"
import { type PheroFunction } from "../domain/PheroApp"
import cleanTypeReferences from "../lib/cleanTypeReferences"
import cloneTS from "../lib/cloneTS"
import * as tsx from "../tsx"

export default function generateFunctionDeclaration(
  func: PheroFunction,
  typeChecker: ts.TypeChecker,
): ts.MethodDeclaration {
  return tsx.method({
    name: func.name,
    params: func.parameters.map((param) =>
      tsx.param({
        name: param.name,
        questionToken: param.questionToken,
        type: cleanTypeReferences(cloneTS(param.type), typeChecker),
      }),
    ),
    returnType: tsx.type.reference({
      name: "Promise",
      args: [cleanTypeReferences(cloneTS(func.returnType), typeChecker)],
    }),
  })
}
