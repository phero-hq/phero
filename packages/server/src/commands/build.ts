import {
  generateManifest,
  MissingTSConfigFileError,
  parsePheroApp,
} from "@phero/core"
import { ServerCommandBuild } from "lib"
import fs from "fs"
import path from "path"
import ts, { CompilerOptions } from "typescript"

export default function buildCommand(command: ServerCommandBuild) {
  const projectPath = process.cwd()

  const tsConfigFilePath = ts.findConfigFile(
    projectPath,
    ts.sys.fileExists,
    "tsconfig.json",
  )

  if (!tsConfigFilePath) {
    throw new MissingTSConfigFileError(projectPath)
  }

  const tsConfig: ts.ParsedCommandLine | undefined =
    ts.getParsedCommandLineOfConfigFile(
      tsConfigFilePath,
      undefined,
      ts.sys as any,
    )

  if (!tsConfig) {
    throw new Error("Can't parse tsconfig.json")
  }

  const hasES2015 = tsConfig.options.lib?.some((lib: string) =>
    /(es2015$)|(es2015\.d\.ts)|(es2015.promise$)|(es2015\.promise\.d\.ts)/.test(
      lib.toLowerCase(),
    ),
  )
  const hasES5 = tsConfig.options.lib?.some((lib: string) =>
    /(es5$)|(es5\.d\.ts)/.test(lib.toLowerCase()),
  )

  const compilerOpts: CompilerOptions = {
    ...tsConfig.options,
    // declaration: true,
    // NOTE: we need Promise support in our declaration file. In a normal TS project you would add
    // the "es2015". Because we're implementing a file system here, sort of, we need to set the file
    // name more explicitly. (Implementing our own fileExists makes compilation much much faster.)
    lib: [
      ...(tsConfig.options.lib ?? []),
      // support for Promise
      ...(hasES2015 ? [] : ["lib.es2015.d.ts"]),
      // support for Pick, Omit, and other TS utilities
      ...(hasES5 ? [] : ["lib.es5.d.ts"]),
    ],
    outDir: path.join(projectPath, ".build"),
    // target: ts.ScriptTarget.ES5,
    // module: ts.ModuleKind.CommonJS,
  }

  const compilerHost = ts.createCompilerHost(compilerOpts)

  const program = ts.createProgram({
    host: compilerHost,
    options: compilerOpts,
    rootNames: [`${projectPath}/src/phero.ts`],
  })

  const app = parsePheroApp(program)
  const { content: dts } = generateManifest(app)
  const manifestPath = path.join(projectPath, "phero-manifest.d.ts")
  fs.writeFileSync(manifestPath, dts)
}
