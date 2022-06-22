import {
  ClientCommandName,
  DEFAULT_CLIENT_PORT,
  DEFAULT_SERVER_PORT,
  DEFAULT_SERVER_URL,
  SamenCommandDevEnv,
  ServerCommandName,
} from "@samen/dev"
import { Box } from "ink"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { fatalError } from "../process"
import { Project } from "../types"
import getProjects from "../utils/getProjects"
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

  const maxProjectPathLength = useMemo(() => {
    let result = 0
    for (const project of projects) {
      if (project.path.length > result) {
        result = project.path.length
      }
    }
    return result
  }, [projects])

  const updateProjects = useCallback(async () => {
    try {
      const newProjects = await getProjects()
      if (newProjects.length === 0) {
        throw new Error("No Samen project found")
      } else {
        setProjects(newProjects)
      }
    } catch (error) {
      fatalError(error)
    }
  }, [])

  useEffect(() => {
    updateProjects()
  }, [])

  return (
    <Box flexDirection="column" width="100%" padding={1}>
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
            />
          )
        }
      })}
    </Box>
  )
}
