import {
  generateAppDeclarationFile,
  generateRPCProxy,
  MissingPheroFileError,
  MissingTSConfigFile,
  parsePheroApp,
} from "@phero/core"
import { ServerCommandExport, ServerExportFlavor } from "@phero/dev"
import fs from "fs"
import path from "path"
import ts, { CompilerOptions } from "typescript"
import { ExportBundle, MetaExportFiles } from "./domain"
import generateGCloudFunctionsExport from "./gcloud-functions"
import generateNodeJSExport from "./nodejs"

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
    outDir: path.join(projectPath, "export"),
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
  const pheroExecution = generateRPCProxy(app, typeChecker)

  const exportPath = path.join(projectPath, "export")

  const readFile = (filePath: string): string =>
    fs.readFileSync(filePath, {
      encoding: "utf-8",
    })

  const metaExportFiles: MetaExportFiles = {
    "phero-manifest.d.ts": dts,
    "phero-execution.js": pheroExecution.js,
    "phero.js": readFile(path.join(exportPath, "phero.js")),
    "package.json": readFile(path.join(projectPath, "package.json")),
    "package-lock.json": readFile(path.join(projectPath, "package-lock.json")),
  }

  switch (command.flavor) {
    case ServerExportFlavor.NodeJS: {
      const bundles = generateNodeJSExport(app, metaExportFiles)
      for (const bundle of bundles) {
        writeToDisk(exportPath, bundle)
      }
      console.log("Done exporting to ./export, to run all your services:")
      console.log("(cd ./export && npm i && node ./index.js)")
      console.log(
        `To run one specific services, e.g. "${app.services[0].name}":`,
      )
      console.log(
        `(cd ./export && npm i && node ./${app.services[0].name}/index.js)`,
      )
      break
    }
    case ServerExportFlavor.GCloudFunctions: {
      const bundles = generateGCloudFunctionsExport(app, metaExportFiles)
      for (const bundle of bundles) {
        writeToDisk(exportPath, bundle)
      }
      console.log(
        `Done exporting ${
          bundles.length === 1 ? "1 service" : `${bundles.length} services`
        } to ./export`,
      )
      break
    }
  }
}

function writeToDisk(exportPath: string, bundle: ExportBundle): void {
  const bundlePath = path.join(exportPath, bundle.name)
  fs.mkdirSync(bundlePath, { recursive: true })

  for (const exportFile of bundle.files) {
    const exportFilePath = path.join(bundlePath, exportFile.name)
    fs.writeFileSync(exportFilePath, exportFile.content)
  }
}
