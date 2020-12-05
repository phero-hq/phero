#!/usr/bin/env node

import {
  generateApiEndpoints,
  generateManifest,
  paths,
  SamenClientNotInstalledError,
  SamenManifest,
  validateProject,
} from "@samen/core"
import { exec } from "child_process"
import { promises as fs } from "fs"
import { Project } from "ts-morph"
import util from "util"

const execAsync = util.promisify(exec)

export default async function build(): Promise<void> {
  const project = new Project({
    tsConfigFilePath: `${paths.userProjectDir}/tsconfig.json`,
  })

  const samenSourceFile = project.getSourceFile("samen.ts")

  if (samenSourceFile === undefined) {
    console.error(`Couldn't find samen.ts in project ${paths.userProjectDir}`)
    process.exit(1)
  }

  const samenFilePath = samenSourceFile.getFilePath()

  validateProject(project)

  const manifest = generateManifest(samenSourceFile, project.getTypeChecker())
  await writeManifestFile(manifest, paths.userManifestFile)
  const samenConfig = await readSamenConfig()

  if (samenConfig) {
    console.log("Building client SDK's...")
    await buildClientSDKs(manifest, samenConfig.clients)

    console.log("Building API endpoints...")
    await generateApiEndpoints(manifest, samenFilePath)
  }
}

interface SamenConfig {
  clients: string[]
}

async function readSamenConfig(): Promise<SamenConfig | null> {
  try {
    const samenConfig = await fs.readFile(paths.userConfigFile)
    // TODO validate samenConfig
    return JSON.parse(samenConfig.toString()) as SamenConfig
  } catch (e) {
    if (e.code === "ENOENT") {
      return null
    }
    throw e
  }
}

async function buildClientSDKs(
  manifest: SamenManifest,
  clientPaths: string[],
): Promise<void> {
  for (const configuredClientPath of clientPaths) {
    const clientPath = paths.clientProjectDir(configuredClientPath)
    console.log(` Building client for: "${configuredClientPath}"`)

    console.log(` Writing manifest file...`)
    await writeManifestFile(manifest, paths.clientManifestFile(clientPath))

    console.log(` Building client SDK...`)
    const binPath = paths.clientBinFile(clientPath)
    try {
      await fs.stat(binPath)
    } catch (error) {
      throw new SamenClientNotInstalledError(clientPath)
    }
    await execAsync(`"${binPath}" build`, { cwd: clientPath })
  }
}

async function writeManifestFile(
  manifest: SamenManifest,
  path: string,
): Promise<void> {
  await fs.writeFile(path, JSON.stringify(manifest, null, 4))
}
