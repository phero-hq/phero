import {
  PheroCommandHelp,
  PheroCommandName,
  pheroHelp,
  pheroHelpInit,
} from "lib"

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
