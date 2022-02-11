import { SamenCommand } from "@samen/dev"
import { createContext, ReactNode, useContext } from "react"

const Context = createContext<SamenCommand>({
  debug: false,
})

export function useCommand(): SamenCommand {
  return useContext(Context)
}

export const CommandProvider = Context.Provider
