import { spawn } from "child_process"

export function redirectToServer(argv: string[]) {
  spawn("npm", ["exec", "--", "phero-server", ...argv], {
    cwd: process.cwd(),
    detached: false,
    stdio: "inherit",
  })
}

export function redirectToClient(argv: string[]) {
  spawn("npm", ["exec", "--", "phero-client", ...argv], {
    cwd: process.cwd(),
    detached: false,
    stdio: "inherit",
  })
}
