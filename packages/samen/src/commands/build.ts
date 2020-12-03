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

const execAsync = util.promisify(exec)
const buildPath = path.join(__dirname, "../../build")
const rpcsPath = path.join(buildPath, "rpcs")

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
  await writeManifestFile(manifest, buildPath)
  const samenConfig = await readSamenConfig(userProjectPath)

  if (samenConfig) {
    console.log("Building client SDK's...")
    try {
      await buildClientSDKs(userProjectPath, samenConfig.clients, manifest)
    } catch (error) {
      console.error(error)
      process.exit(1)
    }

    console.log("Building API endpoints...")
    try {
      await generateApiEndpoints(manifest, samenSourceFile, rpcsPath)
    } catch (error) {
      console.error(error)
      process.exit(1)
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

async function buildClientSDKs(
  userProjectPath: string,
  clientPaths: string[],
  manifest: SamenManifest,
): Promise<void> {
  for (const relOrAbsClientPath of clientPaths) {
    const clientPath = path.resolve(userProjectPath, relOrAbsClientPath)
    console.log(` Client path: ${clientPath}`)

    console.log(` Writing manifest file...`)
    await writeManifestFile(manifest, clientPath)

    console.log(` Building client SDK...`)
    try {
      await fs.stat(`${clientPath}/node_modules/.bin/samen`)
      await fs.stat(`${clientPath}/node_modules/@samen/client`)
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
  await fs.writeFile(
    `${dir}/samen-manifest.json`,
    JSON.stringify(manifest, null, 4),
  )
}
