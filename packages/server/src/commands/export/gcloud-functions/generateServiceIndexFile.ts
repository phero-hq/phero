import ts from "typescript"
import { ParsedPheroApp, tsx } from "@phero/core"

export default function generateServiceIndexFile(): ts.Node[] {
  return [
    tsx.importDeclaration({
      names: ["requestListener"],
      module: "./handler",
    }),
    tsx.verbatim(`
      export function helloWorldService(req: any, res: any) {
        return requestListener(req, res) 
      }
    `),
  ]
}
