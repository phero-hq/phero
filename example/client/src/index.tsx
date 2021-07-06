import { SamenClient } from "@samen/client"

const client = new SamenClient(
  process.env.REACT_APP_SAMEN_URL ?? "http://localhost:4000",
)

async function run() {
  const answer = await client.add(1, 2)
  const example = await client.exampleInterface()
  const namespacedExample =
    await client.ExampleNamespace.exampleNamespacedInterface()
  console.log({ answer, example, namespacedExample })
}

export default run()
