import { SamenCommand } from "@samen/core"
import { Box, Text } from "ink"
import { useCallback, useEffect, useState } from "react"

import { CommandProvider, useCommand } from "../context/CommandContext"
import { ScreenSizeProvider, useScreenSize } from "../context/ScreenSizeContext"
import getProjects, { Project } from "../utils/getProjects"

import ClientProjectStatus from "./ProjectStatus/ClientProjectStatus"
import ServerProjectStatus from "./ProjectStatus/ServerProjectStatus"

export default function App(command: SamenCommand) {
  return (
    <CommandProvider value={command}>
      <ScreenSizeProvider>
        <AppContent />
      </ScreenSizeProvider>
    </CommandProvider>
  )
}

function AppContent() {
  const [projects, setProjects] = useState<Project[]>([])
  const { orientation, columns, rows } = useScreenSize()
  const command = useCommand()

  const updateProjects = useCallback(async () => {
    setProjects(await getProjects())
  }, [])

  useEffect(() => {
    const interval = setInterval(updateProjects, 10000)
    updateProjects()
    return () => clearInterval(interval)
  }, [])

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
              alignItems="center"
              padding={2}
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
