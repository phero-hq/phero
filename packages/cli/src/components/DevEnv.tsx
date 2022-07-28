import {
  ClientCommandName,
  DEFAULT_CLIENT_PORT,
  DEFAULT_SERVER_PORT,
  DEFAULT_SERVER_URL,
  SamenCommandDevEnv,
  ServerCommandName,
} from "@samen/dev"
import { Box, Spacer, Static, Text } from "ink"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { fatalError } from "../process"
import { Project } from "../types"
import checkAndWarnForVersions from "../utils/checkAndWarnForVersions"
import getProjects from "../utils/getProjects"
import maxLength from "../utils/maxLength"
import ActivityIndicator from "./ActivityIndicator"
import ClientProjectStatus from "./ProjectStatus/ClientProjectStatus"
import ServerProjectStatus from "./ProjectStatus/ServerProjectStatus"

interface Props {
  command: SamenCommandDevEnv
}

interface State {
  error?: Error
}

export default class DevEnv extends React.Component<Props, State> {
  state: State = {}

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidUpdate() {
    if (this.state.error) {
      setTimeout(() => {
        fatalError(this.state.error)
      }, 100)
    }
  }

  render() {
    if (this.state.error) {
      // This clears the UI, so that `fatalError` can print the error and exit:
      return null
    }

    return <DevEnvContent command={this.props.command} />
  }
}

function DevEnvContent({ command }: { command: SamenCommandDevEnv }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setLoading] = useState(true)

  const maxProjectPathLength = useMemo(() => {
    return maxLength(projects.map((p) => p.path))
  }, [projects])

  const [rows, setRows] = useState<JSX.Element[]>([])
  const oldRows = useRef<JSX.Element[]>([])
  const onAddRow = useCallback((row: JSX.Element) => {
    const newRows = [...oldRows.current, row]
    oldRows.current = newRows
    setRows(newRows)
  }, [])

  const initialize = useCallback(async () => {
    const newProjects = await getProjects()

    if (newProjects.length === 0) {
      throw new Error("No Samen project found, run `samen init` to create one.")
    }

    await checkAndWarnForVersions(
      newProjects.map((p) => p.path),
      (log) => onAddRow(<Text color="red">{log}</Text>),
    )

    return newProjects
  }, [])

  useEffect(() => {
    initialize()
      .then(setProjects)
      .catch((error) => {
        setLoading(false)
        fatalError(error)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <Box flexDirection="column">
      <Static items={rows}>
        {(item, index) => <Box key={index}>{item}</Box>}
      </Static>

      {rows.length > 0 && <Box height={1} />}

      {isLoading && <ActivityIndicator />}

      {projects.map((project, index) => {
        if (project.type === "client") {
          return (
            <ClientProjectStatus
              key={project.path}
              project={project}
              command={{
                name: ClientCommandName.Watch,
                port: DEFAULT_CLIENT_PORT + index,
                server: { url: DEFAULT_SERVER_URL },
                verbose: command.verbose,
              }}
              maxProjectPathLength={maxProjectPathLength}
            />
          )
        }

        if (project.type === "server") {
          return (
            <ServerProjectStatus
              key={project.path}
              project={project}
              command={{
                name: ServerCommandName.Serve,
                port: DEFAULT_SERVER_PORT,
                verbose: command.verbose,
              }}
              maxProjectPathLength={maxProjectPathLength}
              onAddRow={onAddRow}
            />
          )
        }
      })}
    </Box>
  )
}
