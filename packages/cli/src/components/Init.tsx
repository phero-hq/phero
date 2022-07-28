import util from "util"
import childProcess from "child_process"
const exec = util.promisify(childProcess.exec)
import { promises as fs } from "fs"

import { Box, Text } from "ink"
import SelectInput from "ink-select-input/build"
import { useCallback, useEffect, useState } from "react"
import ActivityIndicator from "./ActivityIndicator"
import { SamenCommandInit } from "@samen/dev"

const serverSamenFile = `import { createService, createFunction } from '@samen/server'

interface Article {
  id: string
  title: string
  body: string
}

class ArticleNotFoundError extends Error {
  constructor(public id: string) {
    super('Article not found by id: ' + id)
  }
}

let fakeDb: Article[] = []

async function getAllArticles(): Promise<Article[]> {
  return fakeDb
}

async function getArticleById(id: string): Promise<Article> {
  const article = fakeDb.find((article) => article.id === id)
  if (!article) {
    throw new ArticleNotFoundError(id)
  }
  return article
}

async function createArticle(article: Article): Promise<void> {
  fakeDb = [...fakeDb, article]
}

async function deleteArticle(id: string): Promise<void> {
  fakeDb = fakeDb.filter((article) => article.id !== id)
}

export const articles = createService({
  getAllArticles: createFunction(getAllArticles),
  getArticleById: createFunction(getArticleById),
  createArticle: createFunction(createArticle),
  deleteArticle: createFunction(deleteArticle),
})
`

const clientSamenFile = `import { SamenClient } from './samen.generated'

const client = new SamenClient()

export default client
`

enum OptionValue {
  InitServer = "InitServer",
  InitClient = "InitClient",
  ShutDown = "ShutDown",
}

function SelectIndicator({ isSelected }: { isSelected?: boolean }) {
  return <Text color="yellow">{isSelected ? "▶ " : "  "}</Text>
}

function SelectItem({
  isSelected,
  label,
}: {
  isSelected?: boolean
  label: string
}) {
  return <Text color={isSelected ? "yellow" : undefined}>{label}</Text>
}

async function hasPackageInstalled(name: string): Promise<boolean> {
  const packageJson = await fs.readFile("./package.json", { encoding: "utf-8" })
  const { dependencies, devDependencies } = JSON.parse(packageJson)
  return [
    ...Object.keys(dependencies ?? {}),
    ...Object.keys(devDependencies ?? {}),
  ].some((key) => key === name)
}

async function installPackage(name: string): Promise<void> {
  if (!(await hasPackageInstalled(name))) {
    await exec(`npm i ${name}`)
  }
}

async function hasSourceFile(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch (error) {
    return false
  }
}

async function createSourceFile(
  filePath: string,
  content: string,
): Promise<void> {
  if (!(await hasSourceFile(filePath))) {
    await exec(`mkdir -p src && echo "${content}" >> ${filePath}`)
  }
}

async function fileContains(filePath: string, line: string): Promise<boolean> {
  const content = await fs.readFile(filePath, { encoding: "utf-8" })
  return content.includes(line)
}

async function addLineToFile(filePath: string, line: string): Promise<void> {
  if (
    !(await hasSourceFile(filePath)) ||
    !(await fileContains(filePath, line))
  ) {
    await exec(`echo "${line}" >> ${filePath}`)
  }
}

export default function Init({ command }: { command: SamenCommandInit }) {
  const [env, setEnv] = useState<SamenCommandInit["env"]>(command.env)
  const [isDone, setDone] = useState(false)

  const initServer = useCallback(async () => {
    await installPackage("@samen/server")
    await createSourceFile("src/samen.ts", serverSamenFile) // TODO: Get src-directory from tsconfig
    setDone(true)
  }, [])

  const initClient = useCallback(async () => {
    await installPackage("@samen/client")
    await createSourceFile("src/samen.ts", clientSamenFile) // TODO: Get src-directory from tsconfig
    await addLineToFile(".gitignore", "samen.generated.ts")
    setDone(true)
  }, [])

  const onSelect = useCallback(async ({ value }: { value: OptionValue }) => {
    switch (value) {
      case OptionValue.InitServer: {
        setEnv("server")
        await initServer()
        break
      }

      case OptionValue.InitClient: {
        setEnv("client")
        await initClient()
        break
      }

      case OptionValue.ShutDown:
        process.exit(0)
        break
    }
  }, [])

  useEffect(() => {
    if (isDone) {
      process.exit(0)
    }
  }, [])

  useEffect(() => {
    if (command.env === "client") {
      initClient()
    }
    if (command.env === "server") {
      initServer()
    }
  }, [command.env])

  return (
    <Box flexDirection="column">
      {isDone ? (
        <Text>Ready to go! Run `samen` again to continue.</Text>
      ) : (
        <>
          {!env && (
            <Box flexDirection="column">
              <Box paddingBottom={1}>
                <Text>
                  Samen is not installed in this directory. What do you want to
                  do?
                </Text>
              </Box>

              <SelectInput
                items={[
                  { value: OptionValue.InitServer, label: "Initialize server" },
                  { value: OptionValue.InitClient, label: "Initialize client" },
                  { value: OptionValue.ShutDown, label: "Exit" },
                ]}
                onSelect={onSelect}
                indicatorComponent={SelectIndicator}
                itemComponent={SelectItem}
              />
            </Box>
          )}

          {env && (
            <>
              {env === "server" && (
                <Text>
                  <ActivityIndicator />
                  <Text dimColor> Initializing </Text>
                  <Text>@samen/server</Text>
                  <Text dimColor>...</Text>
                </Text>
              )}

              {env === "client" && (
                <Text>
                  <ActivityIndicator />
                  <Text dimColor> Initializing </Text>
                  <Text>@samen/client</Text>
                  <Text dimColor>...</Text>
                </Text>
              )}
            </>
          )}
        </>
      )}
    </Box>
  )
}
