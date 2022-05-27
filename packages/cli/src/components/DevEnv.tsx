import {
  ClientCommandName,
  DEFAULT_CLIENT_PORT,
  DEFAULT_SERVER_PORT,
  DEFAULT_SERVER_URL,
  SamenCommandDevEnv,
  ServerCommandName,
} from "@samen/dev"
import { Box, Text } from "ink"
import React, { ErrorInfo, useCallback, useEffect, useState } from "react"
import { ScreenSizeProvider, useScreenSize } from "../context/ScreenSizeContext"
import getProjects, { Project } from "../utils/getProjects"
import ErrorMessage from "./ErrorMessage"
import ClientProjectStatus from "./ProjectStatus/ClientProjectStatus"
import ServerProjectStatus from "./ProjectStatus/ServerProjectStatus"

export default class DevEnv extends React.Component<{
  command: SamenCommandDevEnv
}> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.command.verbose) {
      console.error("Error:", error)
      console.error(errorInfo)
    } else {
      console.error("Something went wrong, try again.")
    }
    process.exit(1)
  }

  render() {
    return (
      <ScreenSizeProvider>
        <DevEnvContent command={this.props.command} />
      </ScreenSizeProvider>
    )
  }
}

function DevEnvContent({ command }: { command: SamenCommandDevEnv }) {
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()
  const [projects, setProjects] = useState<Project[]>([])
  const { orientation, columns, rows } = useScreenSize()

  const updateProjects = useCallback(async () => {
    try {
      setProjects(await getProjects())
    } catch (error) {
      console.log("error!!!", error)
      setError(error)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(updateProjects, 10000)
    updateProjects().then(() => {
      console.log("not loading anymore")
      setLoading(false)
    })
    return () => clearInterval(interval)
  }, [])

  if (error) {
    return <ErrorMessage error={error} verbose={command.verbose} />
  }

  if (isLoading) {
    return <Text>Initializing...</Text>
  }

  return (
    <>
      {projects.length === 0 ? (
        <Text>No projects found</Text>
      ) : (
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
              paddingX={2}
              borderStyle="round"
              borderColor="blue"
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
      )}
    </>
  )
}
