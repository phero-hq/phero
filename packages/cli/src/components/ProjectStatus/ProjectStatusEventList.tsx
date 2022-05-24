import { Box, Text } from "ink"
import { useScreenSize } from "../../context/ScreenSizeContext"

export type StyledEvent = ["default" | "error" | "dimmed" | "busy", string]

interface Props {
  events: StyledEvent[]
}

export default function ProjectStatusEventList({ events }: Props) {
  const { rows } = useScreenSize()
  const lastEvents = events.slice(-(rows / 2))

  return (
    <Box flexDirection="column" flexGrow={1} justifyContent="flex-end">
      {lastEvents.map((event, index) => (
        <Text
          key={event[1] + index}
          dimColor={index < lastEvents.length - 1}
          color={event[0] === "error" ? "red" : undefined}
        >
          {event[1]}
        </Text>
      ))}
    </Box>
  )
}
