import {
  PheroCommandHelp,
  PheroCommandName,
  pheroHelp,
  pheroHelpInit,
} from "@phero/dev"

export default function help(command: PheroCommandHelp) {
  switch (command.command) {
    case PheroCommandName.Init:
      console.log(pheroHelpInit)
      break

    default:
      console.log(pheroHelp)
      break
  }

  process.exit(0)
}
