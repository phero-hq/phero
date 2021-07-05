import { SamenClient } from "@samen/client"

const client = new SamenClient("http://localhost:4000")

async function run() {
  const b = await client.A.b()
  const c = await client.A.c()
  const nexted = await client.A.Nested.nested()
}

export default run()
