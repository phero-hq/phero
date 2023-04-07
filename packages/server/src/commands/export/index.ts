import {
  generateManifest,
  MissingTSConfigFileError,
  parsePheroApp,
} from "@phero/core"
import { ServerCommandExport, ServerExportFlavor } from "@phero/dev"
import child_process from "child_process"
import fs from "fs"
import path from "path"
import ts, { CompilerOptions } from "typescript"
import {
  Export,
  ExportFile,
  MetaExportFiles,
  MetaExportFilesBase,
  MetaExportLockFileName,
} from "./domain"
import generateGCloudFunctionsExport from "./gcloud-functions"
import generateNodeJSExport from "./nodejs"
import generateVercelExport from "./vercel"
import generatePheroExecutionFile from "../../code-gen/generatePheroExecutionFile"
import generateRootIndexFile from "./nodejs/generateRootIndexFile"
import compileExportToJS from "./compileExportToJS"
import generateLibFile from "./nodejs/generateLibFile"

export default function exportCommand(command: ServerCommandExport) {
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
    // target: ts.ScriptTarget.ES5,
    // module: ts.ModuleKind.CommonJS,
  }

  const compilerHost = ts.createCompilerHost(compilerOpts)

  const program = ts.createProgram({
    host: compilerHost,
    options: compilerOpts,
    rootNames: [`${projectPath}/src/phero.ts`],
  })

  const tsOutDir = program.getCompilerOptions().outDir

  if (!tsOutDir) {
    throw new Error(
      'Please provide a "outDir" option in your tsconfig.json file.',
    )
  }

  const exportPath = path.join(projectPath, ".phero")

  rimRafExport(exportPath)
  rimRafExport(tsOutDir)

  program.emit()

  const app = parsePheroApp(program)
  const { content: dts } = generateManifest(app, program.getTypeChecker())
  const pheroExecution = generatePheroExecutionFile(app)

  const lockFile =
    findLockFileInDir(projectPath) ?? findLockFileForWorkspace(projectPath)

  if (!lockFile) {
    throw new Error(
      "No lockfile ('package-lock.json', 'yarn.lock' or 'pnpm-lock.yaml') found in the current directory or for any workspace",
    )
  }

  const metaExportFilesBase: MetaExportFilesBase = {
    "phero-manifest.d.ts": dts,
    "phero-execution.js": pheroExecution.js,
    "phero.js": readFile(path.join(tsOutDir, "phero.js")),
    "package.json": readFile(path.join(projectPath, "package.json")),
  }
  let metaExportFiles: MetaExportFiles
  switch (lockFile.name) {
    case MetaExportLockFileName.Npm:
      metaExportFiles = {
        ...metaExportFilesBase,
        [lockFile.name]: readFile(lockFile.path),
      }
      break
    case MetaExportLockFileName.Yarn:
      metaExportFiles = {
        ...metaExportFilesBase,
        [lockFile.name]: readFile(lockFile.path),
      }
      break
    case MetaExportLockFileName.Pnpm:
      metaExportFiles = {
        ...metaExportFilesBase,
        [lockFile.name]: readFile(lockFile.path),
      }
      break
  }

  switch (command.flavor) {
    case ServerExportFlavor.NodeJS: {
      const nodejsExport = generateNodeJSExport(app, metaExportFiles)
      const rootIndexExport: ExportFile[] = compileExportToJS([
        {
          name: "index.ts",
          nodes: generateRootIndexFile(app),
          isRoot: true,
        },
        {
          name: "lib.ts",
          nodes: generateLibFile(),
          isRoot: true,
        },
      ])

      copyTsOutToBundles(
        tsOutDir,
        nodejsExport.bundles.map((b) => path.join(exportPath, b.name)),
      )
      writeToDisk(exportPath, nodejsExport)
      writeToDisk(exportPath, { bundles: [], otherFiles: rootIndexExport })

      console.log("Done exporting to .phero, to run all your services:")
      console.log("(cd .phero && npm i && node ./index.js)")
      console.log(
        `To run one specific services, e.g. "${app.services[0].name}":`,
      )
      console.log(
        `(cd .phero && npm i && node ./${app.services[0].name}/index.js)`,
      )
      break
    }
    case ServerExportFlavor.GCloudFunctions: {
      const gcloudFunctionsExport = generateGCloudFunctionsExport(
        app,
        metaExportFiles,
      )

      copyTsOutToBundles(
        tsOutDir,
        gcloudFunctionsExport.bundles.map((b) => path.join(exportPath, b.name)),
      )
      writeToDisk(exportPath, gcloudFunctionsExport)

      console.log(
        `Done exporting ${
          gcloudFunctionsExport.bundles.length === 1
            ? "1 service"
            : `${gcloudFunctionsExport.bundles.length} services`
        } to .phero`,
      )
      break
    }
    case ServerExportFlavor.Vercel: {
      const vercelPath = path.join(projectPath, ".vercel")

      rimRafExport(path.join(vercelPath, "output"))

      const vercelExport = generateVercelExport(app, metaExportFiles)

      copyTsOutToBundles(
        tsOutDir,
        vercelExport.bundles.map((b) => path.join(projectPath, b.name)),
      )

      writeToDisk(projectPath, vercelExport)

      for (const bundle of vercelExport.bundles) {
        child_process.execSync(`npm ci`, {
          cwd: path.join(projectPath, bundle.name),
        })
      }

      console.log(
        `Done exporting ${
          vercelExport.bundles.length === 1
            ? "1 service"
            : `${vercelExport.bundles.length} services`
        } to .vercel`,
      )
      console.log(`Now deploy with "npx vercel@latest deploy --prebuilt"`)
      break
    }
  }
}

function findLockFileInDir(
  dir: string,
): { name: MetaExportLockFileName; path: string } | undefined {
  const lockFilePath = path.join(dir, MetaExportLockFileName.Npm)
  if (fs.existsSync(lockFilePath)) {
    return { name: MetaExportLockFileName.Npm, path: lockFilePath }
  }

  const yarnLockFilePath = path.join(dir, MetaExportLockFileName.Yarn)
  if (fs.existsSync(yarnLockFilePath)) {
    return { name: MetaExportLockFileName.Yarn, path: yarnLockFilePath }
  }

  const pnpmLockFilePath = path.join(dir, MetaExportLockFileName.Pnpm)
  if (fs.existsSync(pnpmLockFilePath)) {
    return { name: MetaExportLockFileName.Pnpm, path: pnpmLockFilePath }
  }

  return undefined
}

function findLockFileForWorkspace(
  projectPath: string,
): { name: MetaExportLockFileName; path: string } | undefined {
  const maxDepth = 5

  let currentPath = projectPath

  for (let i = 0; i < maxDepth; i++) {
    if (hasWorkspaceSettingsInDir(currentPath)) {
      const foundLockFile = findLockFileInDir(currentPath)
      if (foundLockFile) {
        return foundLockFile
      } else {
        throw new Error(
          "No lockfile found at the same level of where workspace is defined",
        )
      }
    }

    currentPath = path.join(currentPath, "..")
  }

  return undefined
}

function hasWorkspaceSettingsInDir(dir: string): boolean {
  const packageFilePath = path.join(dir, "package.json")
  if (fs.existsSync(packageFilePath)) {
    const packageJson = JSON.parse(readFile(packageFilePath))
    return !!packageJson.workspaces
  }

  const pnpmWorkspaceFilePath = path.join(dir, "pnpm-workspace.yaml")
  if (fs.existsSync(pnpmWorkspaceFilePath)) {
    return true
  }

  return false
}

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, {
    encoding: "utf-8",
  })
}

function writeToDisk(
  exportPath: string,
  { bundles, otherFiles }: Export,
): void {
  for (const bundle of bundles) {
    const bundlePath = path.join(exportPath, bundle.name)
    fs.mkdirSync(bundlePath, { recursive: true })

    for (const exportFile of bundle.files) {
      const exportFilePath = path.join(bundlePath, exportFile.name)
      fs.writeFileSync(exportFilePath, exportFile.content)
    }
  }

  for (const otherFile of otherFiles ?? []) {
    const exportFilePath = path.join(exportPath, otherFile.name)
    fs.writeFileSync(exportFilePath, otherFile.content)
  }
}

function rimRafExport(exportPath: string): void {
  if (!fs.existsSync(exportPath)) {
    return
  }

  rimRafDir(exportPath)

  function rimRafDir(dirPath: string): void {
    const fileNames = fs.readdirSync(dirPath)
    for (const fileName of fileNames) {
      const subPath = path.join(dirPath, fileName)
      const lstat = fs.lstatSync(subPath)
      if (lstat.isDirectory()) {
        rimRafDir(subPath)
      } else if (lstat.isFile()) {
        fs.unlinkSync(subPath)
      } else if (lstat.isSymbolicLink()) {
        fs.unlinkSync(subPath)
      }
    }
    fs.rmdirSync(dirPath)
  }
}

function copyTsOutToBundles(exportPath: string, bundlePaths: string[]) {
  if (!fs.existsSync(exportPath)) {
    return
  }

  recursiveCopy("")

  function copyFile(relativeFilePath: string): void {
    const srcPath = path.join(exportPath, relativeFilePath)
    for (const bundlePath of bundlePaths) {
      const destPath = path.join(bundlePath, relativeFilePath)
      fs.copyFileSync(srcPath, destPath)
    }
  }

  function copyDir(relativeDirPath: string): void {
    for (const bundlePath of bundlePaths) {
      const destPath = path.join(bundlePath, relativeDirPath)
      fs.mkdirSync(destPath, { recursive: true })
    }
  }

  function recursiveCopy(relativeDirPath: string): void {
    const fileNames = fs.readdirSync(path.join(exportPath, relativeDirPath))
    copyDir(relativeDirPath)
    for (const fileName of fileNames) {
      const relativeFilePath = path.join(relativeDirPath, fileName)
      const lstat = fs.lstatSync(path.join(exportPath, relativeFilePath))
      if (lstat.isDirectory()) {
        recursiveCopy(relativeFilePath)
      } else if (lstat.isFile()) {
        copyFile(relativeFilePath)
      } else if (lstat.isSymbolicLink()) {
        copyFile(relativeFilePath)
      }
    }
  }
}
