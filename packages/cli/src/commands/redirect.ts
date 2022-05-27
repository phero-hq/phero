import { execSync } from "child_process"

export default function redirect(executable: string, argv: string[]) {
  execSync(`${executable} ${argv.join(" ")}`, { stdio: "inherit" })
}
