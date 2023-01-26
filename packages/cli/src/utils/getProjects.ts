import path from "path"
import { promises as fs } from "fs"
import { Project } from "../types"
import { glob } from "glob"

export default async function getProjects(): Promise<Project[]> {
  const projects = await getProjectsInternal()
  return projects.sort((a, b) => (a.type === "client" ? -1 : 1))
}

async function getProjectsInternal(): Promise<Project[]> {
  const projects: Project[] = []

  // Get projects based on workspace-config
  const workspacePaths = await getWorkspacePaths(".")
  if (workspacePaths.length > 0) {
    for (const workspacePath of workspacePaths) {
      const project = await getProject(workspacePath)
      if (project) {
        projects.push(project)
      }
    }
  }
  if (projects.length > 0) {
    return projects
  }

  // Get nested projects (1 level deep)
  for (const fileName of await fs.readdir(".")) {
    const filePath = path.join(".", fileName)
    if ((await fs.stat(filePath)).isDirectory()) {
      const nestedProject = await getProject(filePath)
      if (nestedProject) {
        projects.push(nestedProject)
      }
    }
  }
  if (projects.length > 0) {
    return projects
  }

  // Get project at the root level
  const rootProject = await getProject(".")
  if (rootProject) {
    projects.push(rootProject)
  }
  return projects
}

interface PackageJson {
  workspaces?: string[]
  dependencies?: { [key: string]: string }
  devDependencies?: { [key: string]: string }
}

async function getPackageJson(
  dirPath: string,
): Promise<PackageJson | undefined> {
  const packagePath = path.join(dirPath, "package.json")
  if (await exists(packagePath)) {
    const packageString = await fs.readFile(packagePath, "utf-8")
    return JSON.parse(packageString)
  } else {
    return undefined
  }
}

async function getWorkspacePaths(dirPath: string): Promise<string[]> {
  const packageJson = await getPackageJson(dirPath)
  const result: string[] = []

  if (packageJson?.workspaces) {
    for (const pattern of packageJson.workspaces) {
      result.push(...(await getWorkspacePathsForGlobPattern(pattern)))
    }
  }

  return result
}

async function getWorkspacePathsForGlobPattern(
  pattern: string,
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(pattern, (error, matches) => {
      if (error) {
        reject(error)
      } else {
        resolve(matches)
      }
    })
  })
}

async function getProject(dirPath: string): Promise<Project | undefined> {
  const packageJson = await getPackageJson(dirPath)

  if (
    packageJson?.dependencies?.["@phero/client"] ||
    packageJson?.devDependencies?.["@phero/client"]
  ) {
    return { type: "client", path: dirPath }
  }

  if (
    packageJson?.dependencies?.["@phero/server"] ||
    packageJson?.devDependencies?.["@phero/server"]
  ) {
    return { type: "server", path: dirPath }
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}
