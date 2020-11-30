#!/usr/bin/env node

import path from "path"
import { exec } from "child_process"
import util from "util"
import { promises as fs } from "fs"
import { generateManifest } from "@samen/core"
import { Project } from "ts-morph"

const execAsync = util.promisify(exec)

export async function runDevServer(): Promise<void> {}

export async function build(): Promise<void> {
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

  const samenManifest = generateManifest(
    samenSourceFile,
    project.getTypeChecker(),
  )

  const samenManifestPath = path.join(__dirname, "../build/samen-manifest.json")
  const samenManifestJSON = JSON.stringify(samenManifest, null, 4)
  await fs.writeFile(samenManifestPath, samenManifestJSON)

  const samenConfig = await readSamenConfig(userProjectPath)

  if (samenConfig) {
    for (const relOrAbsClientPath of samenConfig.clients) {
      const clientPath = path.resolve(userProjectPath, relOrAbsClientPath)
      const clientManifestPath = path.join(clientPath, "./samen-manifest.json")
      await fs.writeFile(clientManifestPath, samenManifestJSON)
      await execAsync(`./node_modules/.bin/samen-client build`, {
        cwd: clientPath,
      })
    }
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
