import { spawn } from "child_process"

export default function redirect(executable: string, argv: string[]) {
  spawn("npm", ["exec", "--", executable, ...argv], {
    cwd: process.cwd(),
    detached: true,
    stdio: "inherit",
  })
}
