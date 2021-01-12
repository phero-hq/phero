import { RPCFunctionParameter, SamenManifest } from "../../../domain/manifest"
import { type } from "./types"

interface Props {
  parameters: RPCFunctionParameter[]
  manifest: SamenManifest
}

export const typedParameters = ({ parameters, manifest }: Props): string =>
  parameters.map((p) => `${p.name}: ${type(p.value, manifest)}`).join(", ")

export const untypedParameters = ({ parameters }: Props): string =>
  parameters.map((p) => p.name).join(", ")

export const parametersFromObject = ({
  parameters,
  objectName,
}: Props & { objectName: string }): string =>
  parameters.map((p) => `${objectName}.${p.name}`).join(", ")
