import { Y, add, isAad, isSjaak } from "@samen/client"

async function run() {
  const result = await add(1, 2)
  console.log("result", result)

  const sjaak = await isSjaak({ x: true, y: 1 })
  const aad = await isAad({ x: true })
  const x: Y = { answer: [1, 1] }
}

run()
