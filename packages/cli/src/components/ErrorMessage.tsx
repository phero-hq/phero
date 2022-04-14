import { Text } from "ink"
import { useCommand } from "../context/CommandContext"

interface Props {
  error: unknown
}

export default function ErrorMessage({ error }: Props) {
  const command = useCommand()

  return (
    <>
      <Text color="red">Error:</Text>
      {error instanceof Error ? (
        <>
          <Text>{error.message}</Text>
          {command.debug && <Text>{error.stack}</Text>}
        </>
      ) : (
        <Text>Unknown error</Text>
      )}
    </>
  )
}
