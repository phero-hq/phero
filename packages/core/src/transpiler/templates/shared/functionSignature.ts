import { RPCFunctionParameter } from "../../../domain"
import { typedParameters } from "./parameters"

interface Props {
  name: string
  parameters?: RPCFunctionParameter[]
  returnType?: string // TODO: JSValue? How would we do promises otherwise?
}

const functionSignature = (p: Props): string => {
  const parameters = p.parameters
    ? typedParameters({ parameters: p.parameters })
    : ""
  const returnType = p.returnType ? `: ${p.returnType}` : ""
  return `${p.name}(${parameters})${returnType}`
}

export default functionSignature
