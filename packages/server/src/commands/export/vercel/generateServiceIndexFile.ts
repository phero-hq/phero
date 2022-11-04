import { tsx } from "@phero/core"
import ts from "typescript"

export default function generateServiceIndexFile(): ts.Node[] {
  return [
    tsx.importDeclaration({
      names: ["requestListener"],
      module: "./handler",
    }),
    tsx.verbatim(`
      export default function(req: any, res: any) {
        return requestListener(req, res) 
      }
    `),
  ]
}
