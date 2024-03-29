import { Box, Text } from "ink"
import { useScreenSize } from "../context/ScreenSizeContext"
import { StyledEventStatus } from "../types"
import ActivityIndicator from "./ActivityIndicator"

interface Props {
  type: "server" | "client"
  projectPath: string
  status: StyledEventStatus
  message: string
  maxProjectPathLength: number
}

export default function ProjectStatus({
  type,
  projectPath,
  status,
  message,
  maxProjectPathLength,
}: Props): JSX.Element {
  return (
    <Box>
      <Box marginRight={1} width={15 + maxProjectPathLength}>
        <Text dimColor>{`phero-${type} ${projectPath && "@ "}`}</Text>
        <Text color="yellow">{projectPath}</Text>
      </Box>

      <Box>
        {status === "busy" && (
          <Text>
            <ActivityIndicator />
            {` ${message}`}
          </Text>
        )}

        {status === "default" && (
          <Text>
            <Text color="green">✓</Text>
            {` ${message}`}
          </Text>
        )}

        {status === "error" && (
          <Text>
            <Text color="red">✖</Text>
            {` ${message}`}
          </Text>
        )}
      </Box>
    </Box>
  )
}
