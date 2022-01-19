import { Box, Text } from "ink"
import { useCallback, useEffect, useState } from "react"
import FullScreen, { useScreenSize } from "./FullScreen"
import getProjects, {
  ClientProject,
  Project,
  ServerProject,
} from "./getProjects"

export default function App() {
  return (
    <FullScreen>
      <AppContent />
    </FullScreen>
  )
}

function ClientProjectStatus({ project }: { project: ClientProject }) {
  return (
    <Box flexDirection="column">
      <Text>Path: {project.path}</Text>
      <Text>Type: {project.type}</Text>
    </Box>
  )
}

function ServerProjectStatus({ project }: { project: ServerProject }) {
  return (
    <Box flexDirection="column">
      <Text>Path: {project.path}</Text>
      <Text>Type: {project.type}</Text>
    </Box>
  )
}

function AppContent() {
  const [projects, setProjects] = useState<Project[]>([])
  const { orientation, columns, rows } = useScreenSize()

  const updateProjects = useCallback(async () => {
    setProjects(await getProjects())
  }, [])

  useEffect(() => {
    const interval = setInterval(updateProjects, 5000)
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
          height={rows}
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
