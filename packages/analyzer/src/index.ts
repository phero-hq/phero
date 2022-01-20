import ts from "typescript"
import fs from "fs"
import { DevServerCompilerHost } from "./DevServerCompilerHost"
import generateAppDeclarationFile from "./generateAppDeclarationFile"
import generateClient from "./generateClient"
import { parseAppDeclarationFileContent } from "./parseAppDeclaration"
import parseSamenApp from "./parseSamenApp"
import DevServer from "./server/DevServer"
import { VirtualCompilerHost } from "./VirtualCompilerHost"
import WatchProgram from "./WatchProgram"
import writeClientSource from "./writeClientSource"

const input = "/Users/kamilafsar/Projects/samen/example/server"
// const input = "/Users/kamilafsar/Projects/slimste-mens/api"
const outputClient = "/Users/kamilafsar/Projects/samen/packages/analyzer/out"
const outputServer =
  "/Users/kamilafsar/Projects/samen/packages/analyzer/samen_dist"

// const program = new WatchProgram(input)

// program.onError(() => console.error("oops error!"))
// program.onCompileSucceeded(
//   async (samenSourceFile: ts.SourceFile, typeChecker: ts.TypeChecker) => {
//     console.info("something changed!")
//     const t1 = Date.now()
//     const app = parseSamenApp(samenSourceFile, typeChecker)
//     const dts = generateAppDeclarationFile(app, typeChecker)
//     const x = parseAppDeclarationFileContent(dts)
//     const clientSource = generateClient(x, typeChecker)
//     await writeClientSource(outputClient, clientSource)

//     const t2 = Date.now()
//     console.log("update in", t2 - t1)
//   },
// )
// program.close()

const host = new DevServerCompilerHost({
  outDir: outputServer,
})

// host.addFile(
//   "rpc-proxy.ts",
//   `
//   import * as s from './samen'

//   export function kees(aap: number) {
//     console.log(\`halloY \${aap} kees\`)
//   }
// `,
// )

// const prog = host.createProgram(["rpc-proxy.ts"])

// const result = prog.emit()

// prog.emit()

// const x = require("/Users/kamilafsar/Projects/samen/packages/analyzer/samen_dist/samen/packages/analyzer/rpc-proxy")
// console.log("AAP", x.kees(123))

// console.log("result", result)

const devServer = new DevServer({
  projectPath: input,
})

devServer.on("update", (evt) => {
  console.log("DEV SERVER UPDATE", evt)
})

// console.log("result", prog.getSemanticDiagnostics())
