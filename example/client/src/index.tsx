import { add, isAad, isSjaak } from "@samen/client"

async function run() {
  const result = await add(1, 2)
  console.log("result", result)

  const sjaak = await isSjaak({ x: true })
  const aad = await isAad({ x: true })
}

run()
