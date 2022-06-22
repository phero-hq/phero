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
  const { orientation, columns, rows } = useScreenSize()

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
    <Box
      width={columns}
      height={command.verbose ? undefined : rows}
      flexDirection={orientation === "portrait" ? "column" : "row"}
    >
      {projects.map((project, index) => (
        <Box
          key={project.path}
          flexGrow={project.type === "server" ? 1 : undefined}
          flexBasis={project.type === "server" ? "100%" : undefined}
          paddingY={1}
          paddingLeft={1}
          paddingRight={4}
        >
          {project.type === "client" && (
            <ClientProjectStatus
              project={project}
              command={{
                name: ClientCommandName.Watch,
                port: DEFAULT_CLIENT_PORT + index,
                server: { url: DEFAULT_SERVER_URL },
                verbose: command.verbose,
              }}
            />
          )}
          {project.type === "server" && (
            <ServerProjectStatus
              project={project}
              command={{
                name: ServerCommandName.Serve,
                port: DEFAULT_SERVER_PORT,
                verbose: command.verbose,
              }}
            />
          )}
        </Box>
      ))}
    </Box>
  )
}
