import ts from "typescript"
import { MissingSamenFileError, MissingTSConfigFile } from "@samen/core"

const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
}

type BuildStartCallback = () => void
type BuildSuccessCallback = (
  samenSourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker,
) => void
type BuildFailedCallback = (errorMessage: string) => void

export default class WatchProgram {
  public readonly projectDir: string // TODO: private?
  private readonly tsConfigFilePath: string
  private watchProgram?: ts.WatchOfConfigFile<ts.BuilderProgram>

  constructor(
    absoluteProjectDir: string,
    private readonly buildStartCallback: BuildStartCallback,
    private readonly buildSuccessCallback: BuildSuccessCallback,
    private readonly buildErrorCallback: BuildFailedCallback,
  ) {
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
  }

  public start() {
    const host = ts.createWatchCompilerHost(
      this.tsConfigFilePath,
      {},
      ts.sys,
      ts.createSemanticDiagnosticsBuilderProgram,
      this.reportDiagnostic.bind(this),
      this.reportWatchStatus.bind(this),
    )
    this.watchProgram = ts.createWatchProgram(host)
    this.watchProgram.getProgram().emit()

    this.onBuildComplete(
      this.watchProgram.getProgram().getSemanticDiagnostics(),
    )
  }

  public close() {
    this.watchProgram?.close()
  }

  private reportDiagnostic(diagnostic: ts.Diagnostic) {}

  private reportWatchStatus(
    diagnostic: ts.Diagnostic,
    newLine: string,
    options: ts.CompilerOptions,
    errorCount?: number,
  ) {
    if (this.watchProgram) {
      if (diagnostic.code === 6031 || diagnostic.code === 6032) {
        this.onBuildStart()
      } else {
        this.onBuildComplete(
          this.watchProgram.getProgram().getSemanticDiagnostics(),
        )
      }
    }
  }

  private onBuildStart() {
    this.buildStartCallback()
  }

  private onBuildComplete(diagnostics: readonly ts.Diagnostic[]) {
    const errorDiagnostics = diagnostics.filter(
      (d) => d.category === ts.DiagnosticCategory.Error,
    )
    if (errorDiagnostics.length > 0) {
      this.onBuildFailed(errorDiagnostics)
    } else {
      this.onBuildSuccess()
    }
  }

  private onBuildSuccess() {
    if (!this.watchProgram) {
      throw new Error("WatchProgram not ready")
    }

    const program = this.watchProgram.getProgram()

    // TODO check all root dirs for samen.ts
    const sourceFile = program.getSourceFile(`${this.projectDir}/src/samen.ts`)

    if (!sourceFile) {
      throw new MissingSamenFileError(this.projectDir)
    }

    this.buildSuccessCallback(
      sourceFile.getSourceFile(),
      this.watchProgram.getProgram().getProgram().getTypeChecker(),
    )
  }

  private onBuildFailed(diagnostics: readonly ts.Diagnostic[]) {
    const errorMessage = ts.formatDiagnostics(diagnostics, {
      getCanonicalFileName: (f) => f,
      getCurrentDirectory: () => this.projectDir,
      getNewLine: () => "\n",
    })
    this.buildErrorCallback(errorMessage)
  }
}
