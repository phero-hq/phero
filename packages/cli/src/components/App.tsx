import { SamenCommand } from "@samen/cli-lib"
import { Box, Text } from "ink"
import React, { ErrorInfo } from "react"
import { useCallback, useEffect, useState } from "react"

import { CommandProvider, useCommand } from "../context/CommandContext"
import { ScreenSizeProvider, useScreenSize } from "../context/ScreenSizeContext"
import getProjects, { Project } from "../utils/getProjects"

import ClientProjectStatus from "./ProjectStatus/ClientProjectStatus"
import ServerProjectStatus from "./ProjectStatus/ServerProjectStatus"

export default class App extends React.Component<SamenCommand> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.debug) {
      console.error(error)
      console.error(errorInfo)
    } else {
      console.error("Something went wrong, try again.")
    }
    process.exit(1)
  }

  render() {
    return (
      <CommandProvider value={this.props}>
        <ScreenSizeProvider>
          <AppContent />
        </ScreenSizeProvider>
      </CommandProvider>
    )
  }
}

function AppContent() {
  const [isLoading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const { orientation, columns, rows } = useScreenSize()
  const command = useCommand()

  const updateProjects = useCallback(async () => {
    setProjects(await getProjects())
  }, [])

  useEffect(() => {
    const interval = setInterval(updateProjects, 10000)
    updateProjects().then(() => setLoading(false))
    return () => clearInterval(interval)
  }, [])

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
          height={command.debug ? undefined : rows}
          flexDirection={orientation === "portrait" ? "column" : "row"}
        >
          {projects.map((project) => (
            <Box
              key={project.path}
              flexGrow={1}
              flexBasis="100%"
              paddingY={1}
              paddingX={2}
              borderStyle="round"
              borderColor="blue"
            >
              {project.type === "client" && (
                <ClientProjectStatus project={project} />
              )}
              {project.type === "server" && (
                <ServerProjectStatus project={project} />
              )}
            </Box>
          ))}
        </Box>
      )}
    </>
  )
}
