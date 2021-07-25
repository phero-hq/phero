#!/usr/bin/env node

import {
  dirExists,
  ensureDir,
  Environment,
  paths,
  readConfigFile,
  SamenConfig,
  SamenFileMissingError,
  SamenManifest,
  startSpinner,
  validateProject,
} from "@samen/core"
import crypto from "crypto"
import { promises as fs } from "fs"
import path from "path"
import { Project } from "ts-morph"
import generateApiEndpoints from "../transpiler/generateApiEndpoints"
import generateManifest from "../transpiler/generateManifest"

export default async function build(
  environment: Environment,
  manifestPath: string,
  isDebugFlag: boolean = false,
): Promise<void> {
  const { manifest, samenFilePath } = await buildManifest(manifestPath)
  const config = await readConfigFile()
  await buildRPCFunctions(manifest, samenFilePath, config, isDebugFlag)
}

export async function buildManifest(manifestPath: string): Promise<{
  manifest: SamenManifest
  samenFilePath: string
  hash: string
}> {
  const spinner = startSpinner("Generating manifest")

  spinner.setSubTask("Making sure build dir exists")
  await ensureDir(paths.userBuildDir)

  spinner.setSubTask("Reading project")
  const project = new Project({
    tsConfigFilePath: `${paths.userProjectDir}/tsconfig.json`,
  })
  const samenSourceFile = project.getSourceFile("samen.ts")

  if (samenSourceFile === undefined) {
    throw new SamenFileMissingError(`${paths.userProjectDir}/samen.ts`)
  }
  const samenFilePath = samenSourceFile.getFilePath()

  spinner.setSubTask("Validating project")
  validateProject(project)

  spinner.setSubTask("Generating server index file")
  await generateServerIndexFile(project.getCompilerOptions().outDir)

  spinner.setSubTask("Creating manifest file")
  const manifest = generateManifest(samenSourceFile, project.getTypeChecker())
  const manifestJsonString = JSON.stringify(manifest, null, 4)
  await fs.writeFile(manifestPath, manifestJsonString)
  const hash = await createHash(manifestJsonString)
  spinner.succeed("Generated manifest")

  return { manifest, samenFilePath, hash }
}

export async function buildRPCFunctions(
  manifest: SamenManifest,
  samenFilePath: string,
  config: SamenConfig,
  isDebugFlag: boolean,
): Promise<void> {
  const spinner = startSpinner("Generating RPC functions")
  await generateApiEndpoints(manifest, samenFilePath, config, isDebugFlag)
  spinner.succeed("Generated RPC functions")
}

async function generateServerIndexFile(outDir?: string): Promise<void> {
  if (outDir && (await dirExists(outDir))) {
    await fs.writeFile(
      path.join(outDir, "samen-server.js"),
      "require('@samen/samen/build/production-server.js')",
    )
  }
}

async function createHash(manifestJsonString: string): Promise<string> {
  return crypto.createHash("sha1").update(manifestJsonString).digest("base64")
}
