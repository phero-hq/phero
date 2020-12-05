#!/usr/bin/env node

import { promises as fs } from "fs"
import { Project } from "ts-morph"
import {
  generateApiEndpoints,
  generateManifest,
  paths,
  validateProject,
} from "@samen/core"

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

  console.log("Building manifest file...")
  const manifest = generateManifest(samenSourceFile, project.getTypeChecker())
  await fs.writeFile(paths.userManifestFile, JSON.stringify(manifest, null, 4))

  console.log("Building API endpoints...")
  await generateApiEndpoints(manifest, samenFilePath)
}
