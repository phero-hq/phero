import path from "path"
import fs from "fs"
import { ServerCommandExport } from "@phero/dev"
import ts, { CompilerOptions } from "typescript"
import {
  generateAppDeclarationFile,
  generateRPCProxy,
  generateExport,
  MissingPheroFileError,
  MissingTSConfigFile,
  parsePheroApp,
} from "@phero/core"

export default function exportCommand(command: ServerCommandExport) {
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
    outDir: path.join(projectPath, "build"),
    // target: ts.ScriptTarget.ES5,
    // module: ts.ModuleKind.CommonJS,
  }

  const compilerHost = ts.createCompilerHost(compilerOpts)

  const program = ts.createProgram({
    host: compilerHost,
    options: compilerOpts,
    rootNames: [`${projectPath}/src/phero.ts`],
  })

  program.emit()

  const pheroSourceFile = program.getSourceFile(`${projectPath}/src/phero.ts`)

  if (!pheroSourceFile) {
    throw new MissingPheroFileError(projectPath)
  }

  const typeChecker = program.getTypeChecker()
  const app = parsePheroApp(pheroSourceFile, typeChecker)
  const dts = generateAppDeclarationFile(app, typeChecker)
  const output = generateRPCProxy(app, typeChecker)
  const exportedFiles = generateExport(app)

  const buildPath = path.join(projectPath, "build")

  const manifestPath = path.join(projectPath, "phero-manifest.d.ts")
  fs.writeFileSync(manifestPath, dts)

  const pheroExecutionJS = path.join(buildPath, "phero-execution.js")
  fs.writeFileSync(pheroExecutionJS, output.js)

  for (const exportFile of exportedFiles) {
    const exportFilePath = path.join(buildPath, exportFile.name)
    fs.mkdirSync(path.dirname(exportFilePath), { recursive: true })
    fs.writeFileSync(exportFilePath, exportFile.js)
  }

  fs.copyFileSync(
    path.join(projectPath, "package.json"),
    path.join(buildPath, "package.json"),
  )
  fs.copyFileSync(
    path.join(projectPath, "package-lock.json"),
    path.join(buildPath, "package-lock.json"),
  )
  fs.copyFileSync(
    path.join(projectPath, "phero-manifest.d.ts"),
    path.join(buildPath, "phero-manifest.d.ts"),
  )
  console.log("Done exporting to ./build, to run all your services:")
  console.log("(cd ./build && npm i && node ./index.js)")
  console.log(`To run one specific services, e.g. "${app.services[0].name}":`)
  console.log(
    `(cd ./build && npm i && node ./${app.services[0].name}/index.js)`,
  )
}
