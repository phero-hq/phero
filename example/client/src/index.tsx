import { add } from "@samen/client"

async function run() {
  const result = await add(1, 2)
  console.log("result", result)
}

run()
