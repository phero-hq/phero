#!/usr/bin/env node

import {
  generateApiEndpoints,
  generateManifest,
  SamenManifest,
} from "@samen/core"
import { exec } from "child_process"
import { promises as fs } from "fs"
import path from "path"
import { Project } from "ts-morph"
import util from "util"
import {
  clientBinPath,
  clientProjectPath,
  manifestPath,
  serverBuildPath,
  serverConfigPath,
  serverProjectPath,
  serverRpcFunctionsPath,
} from "../paths"

const execAsync = util.promisify(exec)

export default async function build(): Promise<void> {
  const project = new Project({
    tsConfigFilePath: `${serverProjectPath}/tsconfig.json`,
  })

  const samenSourceFile = project.getSourceFile("samen.ts")

  if (samenSourceFile === undefined) {
    console.error(`Couldn't find samen.ts in project ${serverProjectPath}`)
    process.exit(1)
  }

  const serverSamenFilePath = samenSourceFile.getFilePath()

  const diagnostics = project.getPreEmitDiagnostics()
  if (diagnostics.length > 0) {
    for (const diagnostic of diagnostics) {
      console.error(diagnostic.getMessageText())
    }
    process.exit(1)
  }

  const manifest = generateManifest(
    serverProjectPath,
    samenSourceFile,
    project.getTypeChecker(),
  )
  await writeManifestFile(manifest, serverBuildPath)
  const samenConfig = await readSamenConfig()

  if (samenConfig) {
    console.log("Building client SDK's...")
    try {
      await buildClientSDKs(manifest, samenConfig.clients)
    } catch (error) {
      console.error(error)
      process.exit(1)
    }

    console.log("Building API endpoints...")
    try {
      await generateApiEndpoints(
        manifest,
        serverSamenFilePath,
        serverRpcFunctionsPath,
      )
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  }
}

interface SamenConfig {
  clients: string[]
}

async function readSamenConfig(): Promise<SamenConfig | null> {
  try {
    const samenConfig = await fs.readFile(path.join(serverConfigPath))
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
  for (const cp of clientPaths) {
    const clientPath = clientProjectPath(cp)
    console.log(` Client path: ${clientPath}`)

    console.log(` Writing manifest file...`)
    await writeManifestFile(manifest, clientPath)

    console.log(` Building client SDK...`)
    try {
      await fs.stat(clientBinPath(clientPath))
    } catch (error) {
      console.log(
        ` @samen/client does not seem to be installed in ${clientPath}`,
      )
      // TODO: Prompt for running `npm i @samen/client` in clientPath
      process.exit(1)
    }
    await execAsync(`./node_modules/.bin/samen build`, { cwd: clientPath })
  }
}

async function writeManifestFile(
  manifest: SamenManifest,
  dir: string,
): Promise<void> {
  await fs.writeFile(manifestPath(dir), JSON.stringify(manifest, null, 4))
}
