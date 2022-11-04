import { tsx } from "@phero/core"
import { ParsedPheroServiceDefinition } from "@phero/core"
import ts from "typescript"

export default function generateServiceIndexFile(
  service: ParsedPheroServiceDefinition,
): ts.Node[] {
  return [
    tsx.importDeclaration({
      names: ["requestListener"],
      module: "./handler",
    }),
    tsx.verbatim(`
      export function ${service.name}(req: any, res: any) {
        return requestListener(req, res) 
      }
    `),
  ]
}
