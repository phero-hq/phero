import ts from "typescript"
import { Project, SourceFile, TypeChecker } from "ts-morph"
import { MissingSamenFileError, MissingTSConfigFile } from "./errors"

const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
}

type ErrorCallback = () => void
type ChangeCallback = (
  samenSourceFile: SourceFile,
  typeChecker: TypeChecker,
) => void

export default class WatchProgram {
  public readonly projectDir: string
  private readonly tsConfigFilePath: string

  private errorCallback?: ErrorCallback
  private changeCallback?: ChangeCallback
  private readonly watchProgram: ts.WatchOfConfigFile<ts.BuilderProgram>

  constructor(absoluteProjectDir: string) {
    this.projectDir = absoluteProjectDir

    const tsConfigFilePath = ts.findConfigFile(
      absoluteProjectDir,
      ts.sys.fileExists,
      "tsconfig.json",
    )

    if (!tsConfigFilePath) {
      throw new MissingTSConfigFile(absoluteProjectDir)
    }

    this.tsConfigFilePath = tsConfigFilePath
    const host = ts.createWatchCompilerHost(
      tsConfigFilePath,
      {},
      ts.sys,
      ts.createSemanticDiagnosticsBuilderProgram,
      this.reportDiagnostic.bind(this),
      this.reportWatchStatusChanged.bind(this),
    )

    this.watchProgram = ts.createWatchProgram(host)

    this.watchProgram.getProgram().getSemanticDiagnostics()
  }

  public onError(callback: ErrorCallback) {
    this.errorCallback = callback
  }

  public onCompileSucceeded(callback: ChangeCallback) {
    this.changeCallback = callback
    this.provideSamenFileToClient()
  }

  public close() {
    this.watchProgram.close()
    this.errorCallback = undefined
    this.changeCallback = undefined
  }

  private reportDiagnostic(diagnostic: ts.Diagnostic) {
    console.error(
      "TS Error",
      diagnostic.code,
      diagnostic.file?.fileName,
      diagnostic.start,
      diagnostic.length,
      ":",
      ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        formatHost.getNewLine(),
      ),
    )

    if (this.errorCallback) {
      // const diagnostics = this.watchProgram.getProgram().getSemanticDiagnostics()
      // for (const diag of diagnostics) {
      //   if (diag.category === ts.DiagnosticCategory.Error) {

      //   }
      // }
      this.errorCallback()
    }
  }

  private reportWatchStatusChanged(diagnostic: ts.Diagnostic) {
    // console.info(ts.formatDiagnostic(diagnostic, formatHost))

    if (
      diagnostic.category !== ts.DiagnosticCategory.Message ||
      // see https://github.com/microsoft/TypeScript/issues/24625#issuecomment-394447728
      ![6193, 6194].includes(diagnostic.code)
    ) {
      return
    }

    this.provideSamenFileToClient()
  }

  private async provideSamenFileToClient() {
    if (!this.changeCallback) {
      return
    }

    const project = new Project({
      tsConfigFilePath: this.tsConfigFilePath,
    })

    const sourceFile = project.getSourceFile("samen.ts")

    if (!sourceFile) {
      throw new MissingSamenFileError(this.projectDir)
    }

    this.changeCallback(sourceFile, project.getTypeChecker())
  }
}
