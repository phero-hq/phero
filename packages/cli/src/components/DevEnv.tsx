import {
  ClientCommandName,
  DEFAULT_CLIENT_PORT,
  DEFAULT_SERVER_PORT,
  DEFAULT_SERVER_URL,
  SamenCommandDevEnv,
  ServerCommandName,
} from "@samen/dev"
import { Box } from "ink"
import React, { useCallback, useEffect, useState } from "react"
import { ScreenSizeProvider, useScreenSize } from "../context/ScreenSizeContext"
import { fatalError } from "../process"
import getProjects, { Project } from "../utils/getProjects"
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

    return (
      <ScreenSizeProvider>
        <DevEnvContent command={this.props.command} />
      </ScreenSizeProvider>
    )
  }
}

function DevEnvContent({ command }: { command: SamenCommandDevEnv }) {
  const [isLoading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const { rows } = useScreenSize()

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
    const interval = setInterval(updateProjects, 10000)
    updateProjects().then(() => setLoading(false))
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return <ActivityIndicator />
  }

  return (
    // <Box height={command.verbose ? undefined : rows}>
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
            />
          )
        }
      })}
    </Box>
    // </Box>
  )
}
