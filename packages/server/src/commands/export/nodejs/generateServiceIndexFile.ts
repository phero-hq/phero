import { tsx } from "@phero/core"
import ts from "typescript"

import { generateCreateAndStartServer } from "../generateExportHelpers"

export default function generateServiceIndexFile(): ts.Node[] {
  return [
    // import http
    tsx.importDeclaration({
      names: ["createServer"],
      module: "http",
    }),
    // import lib functions
    tsx.importDeclaration({
      names: ["requestListener"],
      module: "./handler",
    }),
    // start server
    generateCreateAndStartServer(),
  ]
}
