#!/usr/bin/env node

import { promises as fs } from "fs"
import { Project } from "ts-morph"
import {
  Environment,
  generateApiEndpoints,
  generateManifest,
  paths,
  SamenFileMissingError,
  validateProject,
} from "@samen/core"

export default async function build(environment: Environment): Promise<void> {
  console.log(`Building samen in ${environment} mode`)

  const project = new Project({
    tsConfigFilePath: `${paths.userProjectDir}/tsconfig.json`,
  })

  const samenSourceFile = project.getSourceFile("samen.ts")

  if (samenSourceFile === undefined) {
    throw new SamenFileMissingError(`${paths.userProjectDir}/samen.ts`)
  }

  const samenFilePath = samenSourceFile.getFilePath()

  validateProject(project)

  console.log("Building manifest file...")
  const manifest = generateManifest(samenSourceFile, project.getTypeChecker())
  await fs.writeFile(paths.userManifestFile, JSON.stringify(manifest, null, 4))

  console.log("Building API endpoints...")
  await generateApiEndpoints(manifest, samenFilePath)
}
