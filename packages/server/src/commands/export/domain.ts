import ts from "typescript"

export interface RawExportFile {
  name: string
  nodes: ts.Node[]
  isRoot?: boolean
}

export interface Export {
  bundles: ExportBundle[]
  otherFiles?: ExportFile[]
}

export interface ExportBundle {
  name: string
  files: ExportFile[]
}

export interface ExportFile {
  name: string
  content: string
}

export enum MetaExportLockFileName {
  Npm = "package-lock.json",
  Yarn = "yarn.lock",
  Pnpm = "pnpm-lock.yaml",
}

type MetaExportFileContent = string

export interface MetaExportFilesBase {
  "phero-manifest.d.ts": MetaExportFileContent
  "phero-execution.js": MetaExportFileContent
  "phero.js": MetaExportFileContent
  "package.json": MetaExportFileContent
}

export type MetaExportFiles = MetaExportFilesBase &
  (
    | { [MetaExportLockFileName.Npm]: MetaExportFileContent }
    | { [MetaExportLockFileName.Yarn]: MetaExportFileContent }
    | { [MetaExportLockFileName.Pnpm]: MetaExportFileContent }
  )
