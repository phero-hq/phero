import util from "util"
import childProcess from "child_process"
const exec = util.promisify(childProcess.exec)
import { promises as fs } from "fs"

import { Box, Text } from "ink"
import SelectInput from "ink-select-input/build"
import { useCallback, useEffect, useState } from "react"
import ActivityIndicator from "./ActivityIndicator"

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

export const articleService = createService({
  getAllArticles: createFunction(getAllArticles),
  getArticleById: createFunction(getArticleById),
  createArticle: createFunction(createArticle),
  deleteArticle: createFunction(deleteArticle),
})
`

const clientSamenFile = `import { SamenClient } from '@samen/client'

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

async function hasSourceFile(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch (error) {
    return false
  }
}

export default function Init() {
  const [currentOption, setCurrentOption] = useState<OptionValue>()
  const [isDone, setDone] = useState(false)

  const initServer = useCallback(async () => {
    setCurrentOption(OptionValue.InitServer)

    if (!(await hasPackageInstalled("@samen/server"))) {
      await exec(`npm i @samen/server`)
    }

    // TODO: Get src-directory from tsconfig
    if (!(await hasSourceFile("src/samen.ts"))) {
      await exec(`mkdir -p src && echo "${serverSamenFile}" >> src/samen.ts`)
    }

    setDone(true)
  }, [])

  const initClient = useCallback(async () => {
    setCurrentOption(OptionValue.InitClient)

    if (!(await hasPackageInstalled("@samen/client"))) {
      await exec(`npm i @samen/client`)
    }

    // TODO: Get src-directory from tsconfig
    if (!(await hasSourceFile("src/samen.ts"))) {
      await exec(`mkdir -p src && echo "${clientSamenFile}" >> src/samen.ts`)
    }

    setDone(true)
  }, [])

  const onSelect = useCallback(async ({ value }: { value: OptionValue }) => {
    switch (value) {
      case OptionValue.InitServer: {
        await initServer()
        break
      }

      case OptionValue.InitClient: {
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

  return (
    <Box flexDirection="column">
      {isDone ? (
        <Text>Ready to go! Run `samen` again to continue.</Text>
      ) : (
        <>
          {!currentOption && (
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
                  { value: OptionValue.ShutDown, label: "Do nothing" },
                ]}
                onSelect={onSelect}
                indicatorComponent={SelectIndicator}
                itemComponent={SelectItem}
              />
            </Box>
          )}

          {currentOption && (
            <>
              {currentOption === OptionValue.InitServer && (
                <Text>
                  <ActivityIndicator />
                  <Text dimColor> Initializing </Text>
                  <Text>@samen/server</Text>
                  <Text dimColor>...</Text>
                </Text>
              )}

              {currentOption === OptionValue.InitClient && (
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
