#!/usr/bin/env node

import path from "path"
import { exec } from "child_process"
import util from "util"
import { promises as fs } from "fs"
import { generateManifest, generateApiEndpoints } from "@samen/core"
import {
  FunctionDeclaration,
  Project,
  SourceFile,
  SymbolFlags,
  SyntaxKind,
} from "ts-morph"

const execAsync = util.promisify(exec)
const buildPath = path.join(__dirname, "../../build")
const rpcsPath = path.join(buildPath, "rpcs")
const manifestPath = path.join(buildPath, "samen-manifest.json")

export default async function build(): Promise<void> {
  const userProjectPath = process.cwd()

  const project = new Project({
    tsConfigFilePath: `${userProjectPath}/tsconfig.json`,
  })

  const samenSourceFile = project.getSourceFile("samen.ts")

  if (samenSourceFile === undefined) {
    console.error(`Couldn't find samen.ts in project ${userProjectPath}`)
    process.exit(1)
  }

  if (project.getPreEmitDiagnostics().length > 0) {
    console.error(
      `Sorry, your project doesn't compile my friend ${userProjectPath}`,
    )
    process.exit(1)
  }

  const manifest = generateManifest(samenSourceFile, project.getTypeChecker())
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 4))
  const samenConfig = await readSamenConfig(userProjectPath)

  if (samenConfig) {
    await buildClientSDKs(userProjectPath, samenConfig.clients)
    await generateApiEndpoints(manifest, samenSourceFile, rpcsPath)
  }
}

interface SamenConfig {
  clients: string[]
}

async function readSamenConfig(
  userProjectPath: string,
): Promise<SamenConfig | null> {
  try {
    const samenConfig = await fs.readFile(
      path.join(userProjectPath, "samen-config.json"),
      { encoding: "utf-8" },
    )

    // TODO validate samenConfig
    return JSON.parse(samenConfig) as SamenConfig
  } catch (e) {
    if (e.code === "ENOENT") {
      return null
    }
    throw e
  }
}

async function buildClientSDKs(
  userProjectPath: string,
  clientPaths: string[],
): Promise<void> {
  for (const relOrAbsClientPath of clientPaths) {
    const clientPath = path.resolve(userProjectPath, relOrAbsClientPath)
    await execAsync(`cp "${manifestPath}" "${clientPath}/samen-manifest.json"`)
    await execAsync(`./node_modules/.bin/samen build`, {
      cwd: clientPath,
    })
  }
}
