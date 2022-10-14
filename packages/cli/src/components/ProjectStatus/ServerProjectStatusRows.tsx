import { ServerDevEventRPC } from "@phero/dev"
import { Box, Text } from "ink"
import maxLength from "../../utils/maxLength"

export function ServerProjectStatusRowLog({
  log,
  dateTime,
}: {
  log: string
  dateTime: string
}): JSX.Element {
  return (
    <Box key={dateTime}>
      <Text dimColor>{`${dateTime} `}</Text>
      <Text>{log}</Text>
    </Box>
  )
}

export function ServerProjectStatusRowRpc({
  event,
}: {
  event: ServerDevEventRPC
}): JSX.Element {
  const url = event.url.replace(/^\//, "").replace(/\//g, ".")

  return (
    <>
      {event.type === "RPC_START" && (
        <Box>
          <Text dimColor>{event.dateTime} </Text>
          <Text dimColor>{url}...</Text>
        </Box>
      )}

      {event.type === "RPC_SUCCESS" && (
        <Box>
          <Text dimColor>{event.dateTime} </Text>
          <Text>{url} </Text>
          <Text color="green">✓ </Text>
          <Text dimColor>{event.ms}ms</Text>
        </Box>
      )}

      {event.type === "RPC_FAILED_NOT_FOUND_ERROR" && (
        <Box flexDirection="column">
          <Box>
            <Text dimColor>{event.dateTime} </Text>
            <Text>{url} </Text>
            <Text color="red">✖ </Text>
            <Text dimColor>{event.ms}ms</Text>
          </Box>

          <Box marginX={2} marginY={1}>
            <Text color="red">Function not found</Text>
          </Box>
        </Box>
      )}

      {event.type === "RPC_FAILED_VALIDATION_ERROR" && (
        <Box flexDirection="column">
          <Box>
            <Text dimColor>{event.dateTime} </Text>
            <Text>{url} </Text>
            <Text color="red">✖ </Text>
            <Text dimColor>{event.ms}ms</Text>
          </Box>

          <Box marginX={2} marginY={1} flexDirection="column">
            <Box marginBottom={1}>
              <Text color="red">
                {event.errors.length === 1
                  ? "Validation error"
                  : "Validation errors"}
              </Text>
            </Box>

            <Box marginBottom={1}>
              <Text color="red">
                {event.input === undefined
                  ? "undefined"
                  : JSON.stringify(event.input, null, 2)}
              </Text>
            </Box>

            <KeyValueTable
              content={event.errors.reduce(
                (result, error) => ({
                  ...result,
                  [error.path]: error.message,
                }),
                {},
              )}
            />
          </Box>
        </Box>
      )}

      {event.type === "RPC_FAILED_FUNCTION_ERROR" && (
        <Box flexDirection="column">
          <Box>
            <Text dimColor>{event.dateTime} </Text>
            <Text>{url} </Text>
            <Text color="red">✖ </Text>
            <Text dimColor>{event.ms}ms</Text>
          </Box>

          <Box marginX={2} marginY={1} flexDirection="column">
            <Box marginBottom={1}>
              <Text color="red">{event.error.name}</Text>
            </Box>

            <Box marginBottom={1}>
              <KeyValueTable content={event.error.props} />
            </Box>

            <Box>
              <Text>{event.error.stack}</Text>
            </Box>
          </Box>
        </Box>
      )}

      {event.type === "RPC_FAILED_SERVER_ERROR" && (
        <Box flexDirection="column">
          <Box>
            <Text dimColor>{event.dateTime} </Text>
            <Text>{url} </Text>
            <Text color="red">✖ </Text>
            <Text dimColor>{event.ms}ms</Text>
          </Box>

          <Box marginX={2} marginY={1} flexDirection="column">
            <Text>{event.error.message}</Text>
            <Text>{event.error.stack}</Text>
          </Box>
        </Box>
      )}
    </>
  )
}

function KeyValueTable({ content }: { content: Record<string, any> }) {
  const entries = Object.entries(content)
  const maxLabelLength = maxLength(entries.map(([k]) => k))
  const format = (value: any) => {
    switch (typeof value) {
      case "undefined":
        return "undefined"

      case "string":
        return value

      case "number":
        return `${value}`

      default:
        return JSON.stringify(value)
    }
  }

  return (
    <Box flexDirection="column">
      {entries.map(([key, value], index) => (
        <Box key={index}>
          <Box width={maxLabelLength} marginRight={2}>
            <Text dimColor>{format(key)}</Text>
          </Box>
          <Text>{format(value)}</Text>
        </Box>
      ))}
    </Box>
  )
}
