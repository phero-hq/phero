import { RPCFunctionParameter } from "../../../domain/manifest"
import { type } from "./types"

interface Props {
  parameters: RPCFunctionParameter[]
}

export const typedParameters = ({ parameters }: Props): string =>
  parameters.map((p) => `${p.name}: ${type(p.value)}`).join(", ")

export const untypedParameters = ({ parameters }: Props): string =>
  parameters.map((p) => p.name).join(", ")

export const parametersFromObject = ({
  parameters,
  objectName,
}: Props & { objectName: string }): string =>
  parameters.map((p) => `${objectName}.${p.name}`).join(", ")
