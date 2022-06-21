import path from "path"
import fs from "fs"
import { ServerCommandBuild } from "@samen/dev"
import ts, { CompilerOptions } from "typescript"
import {
  generateAppDeclarationFile,
  generateRPCProxy,
  generateProductionServer,
  MissingSamenFileError,
  MissingTSConfigFile,
  parseSamenApp,
} from "@samen/core"

export default function build(command: ServerCommandBuild) {
  const projectPath = process.cwd()

  const tsConfigFilePath = ts.findConfigFile(
    projectPath,
    ts.sys.fileExists,
    "tsconfig.json",
  )

  if (!tsConfigFilePath) {
    throw new MissingTSConfigFile(projectPath)
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
    /es2015/.test(lib.toLowerCase()),
  )
  const hasES5 = tsConfig.options.lib?.some((lib: string) =>
    /es2015/.test(lib.toLowerCase()),
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
    rootNames: [`${projectPath}/src/samen.ts`],
  })

  const emitResult = program.emit()

  const samenSourceFile = program.getSourceFile(`${projectPath}/src/samen.ts`)

  if (!samenSourceFile) {
    throw new MissingSamenFileError(projectPath)
  }

  const typeChecker = program.getTypeChecker()
  const app = parseSamenApp(samenSourceFile, typeChecker)
  const dts = generateAppDeclarationFile(app, typeChecker)
  const output = generateRPCProxy(app, typeChecker)
  const productionServer = generateProductionServer(app, typeChecker)

  const buildPath = path.join(projectPath, ".build")

  const manifestPath = path.join(buildPath, "samen-manifest.d.ts")
  fs.writeFileSync(manifestPath, dts)

  const samenExecutionJS = path.join(buildPath, "samen-execution.js")
  fs.writeFileSync(samenExecutionJS, output.js)

  const indexJS = path.join(buildPath, "index.js")
  fs.writeFileSync(indexJS, productionServer.js)

  fs.copyFileSync(
    path.join(projectPath, "package.json"),
    path.join(buildPath, "package.json"),
  )
  fs.copyFileSync(
    path.join(projectPath, "package-lock.json"),
    path.join(buildPath, "package-lock.json"),
  )
}
