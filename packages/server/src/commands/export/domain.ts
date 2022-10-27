import ts from "typescript"

export interface RawExportFile {
  name: string
  nodes: ts.Node[]
  isRoot?: boolean
}

export interface ExportBundle {
  name: string
  files: ExportFile[]
}

export interface ExportFile {
  name: string
  content: string
}

export interface MetaExportFiles {
  "phero-manifest.d.ts": string
  "phero-execution.js": string
  "phero.js": string
  "package.json": string
  "package-lock.json": string
}
