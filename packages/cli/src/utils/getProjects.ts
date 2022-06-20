import path from "path"
import { promises as fs } from "fs"

export interface ClientProject {
  type: "client"
  path: string
}

export interface ServerProject {
  type: "server"
  path: string
}

export type Project = ClientProject | ServerProject

export default async function getProjects(): Promise<Project[]> {
  const projects: (Project | undefined)[] = []

  for (const rootFileName of await fs.readdir("./")) {
    const rootFile = path.join(".", rootFileName)
    if ((await fs.stat(rootFile)).isDirectory()) {
      for (const nestedFileName of await fs.readdir(rootFile)) {
        const nestedFile = path.join(rootFile, nestedFileName)
        if ((await fs.stat(nestedFile)).isDirectory()) {
          // Deeper projects not supported atm
        } else {
          projects.push(await getProject(nestedFile))
        }
      }
    } else {
      projects.push(await getProject(rootFile))
    }
  }

  return projects
    .filter((p): p is Project => !!p)
    .sort((a, b) => (a.type === "client" ? -1 : 1))
}

async function getProject(filePath: string): Promise<Project | undefined> {
  if (!filePath.endsWith("package.json")) {
    return undefined
  }

  const packageString = await fs.readFile(filePath, "utf-8")
  const packageJson = JSON.parse(packageString)

  if (packageJson.dependencies?.["@samen/client"]) {
    return { type: "client", path: formatProjectPath(filePath) }
  }

  if (packageJson.dependencies?.["@samen/server"]) {
    return { type: "server", path: formatProjectPath(filePath) }
  }
}

function formatProjectPath(packageJsonPath: string): string {
  const projectPath = path.relative(".", path.dirname(packageJsonPath))
  return projectPath === "." ? "./" : `./${projectPath}`
}
