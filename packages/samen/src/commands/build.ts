#!/usr/bin/env node

import { promises as fs } from "fs"
import { Project } from "ts-morph"
import {
  Environment,
  generateApiEndpoints,
  generateManifest,
  paths,
  SamenFileMissingError,
  startSpinner,
  validateProject,
} from "@samen/core"

export default async function build(environment: Environment): Promise<void> {
  const spinner = startSpinner("Reading project")

  const project = new Project({
    tsConfigFilePath: `${paths.userProjectDir}/tsconfig.json`,
  })

  const samenSourceFile = project.getSourceFile("samen.ts")

  if (samenSourceFile === undefined) {
    throw new SamenFileMissingError(`${paths.userProjectDir}/samen.ts`)
  }

  const samenFilePath = samenSourceFile.getFilePath()

  validateProject(project)

  spinner.text = "Building manifest file"
  const manifest = generateManifest(samenSourceFile, project.getTypeChecker())
  await fs.writeFile(paths.userManifestFile, JSON.stringify(manifest, null, 4))

  spinner.text = "Building API endpoints"
  await generateApiEndpoints(manifest, samenFilePath)

  spinner.succeed("Build is ready")
}
