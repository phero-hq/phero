import { Box, Text } from "ink"
import { useCallback, useEffect, useState } from "react"
import FullScreen, { useScreenSize } from "./FullScreen"
import getProjects, { Project } from "./getProjects"

export default function App() {
  return (
    <FullScreen>
      <AppContent />
    </FullScreen>
  )
}

function ProjectStatus({ project }: { project: Project }) {
  return (
    <Box
      flexGrow={1}
      flexBasis="100%"
      alignItems="center"
      padding={2}
      borderStyle="round"
      borderColor="blue"
    >
      <Box flexDirection="column">
        <Text>Path: {project.path}</Text>
        <Text>Type: {project.type}</Text>
      </Box>
    </Box>
  )
}

function AppContent() {
  const [projects, setProjects] = useState<Project[]>([])
  const { orientation } = useScreenSize()

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
          width="100%"
          height="100%"
          flexDirection={orientation === "portrait" ? "column" : "row"}
        >
          {projects.map((project) => (
            <ProjectStatus project={project} key={project.path} />
          ))}
        </Box>
      )}
    </>
  )
}
