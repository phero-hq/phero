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

export interface MetaExportLockFile {
  name: MetaExportLockFileName
  path: string
}

type MetaExportFileContent = string

export type MetaExportFiles = {
  "phero-manifest.d.ts": MetaExportFileContent
  "phero-execution.js": MetaExportFileContent
  "phero.js": MetaExportFileContent
  "package.json": MetaExportFileContent
} & {
  [key in MetaExportLockFileName]?: MetaExportFileContent
}
