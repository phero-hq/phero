import { readFileSync } from "fs"
import path from "path"

export default function version() {
  const packageJson = JSON.parse(
    readFileSync(path.resolve(__dirname, `../package.json`)).toString(),
  )
  console.log(packageJson.version)
  process.exit(0)
}
