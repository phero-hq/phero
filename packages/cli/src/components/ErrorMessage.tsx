import { Text } from "ink"

interface Props {
  error: unknown
  verbose: boolean
}

export default function ErrorMessage({ error, verbose }: Props) {
  return (
    <>
      <Text color="red">Error:</Text>
      {error instanceof Error ? (
        <>
          <Text>{error.message}</Text>
          {verbose && <Text>{error.stack}</Text>}
        </>
      ) : (
        <Text>Unknown error</Text>
      )}
    </>
  )
}
