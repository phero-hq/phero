#!/usr/bin/env node

import { promises as fs } from "fs"
import { Project } from "ts-morph"
import path from "path"
import {
  dirExists,
  Environment,
  generateApiEndpoints,
  generateManifest,
  paths,
  readConfigFile,
  SamenConfig,
  SamenFileMissingError,
  SamenManifest,
  startSpinner,
  validateProject,
} from "@samen/core"
import { ensureDir } from "@samen/core"

export default async function build(
  environment: Environment,
  isDebugFlag: boolean = false,
): Promise<void> {
  const { manifest, samenFilePath } = await buildManifest()
  const config = await readConfigFile()
  await buildRPCFunctions(manifest, samenFilePath, config, isDebugFlag)
}

async function buildManifest(): Promise<{
  manifest: SamenManifest
  samenFilePath: string
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
  await fs.writeFile(paths.userManifestFile, JSON.stringify(manifest, null, 4))
  spinner.succeed("Generated manifest")

  return { manifest, samenFilePath }
}

async function buildRPCFunctions(
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
