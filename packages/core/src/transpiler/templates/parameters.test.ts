import { JSType, RPCFunctionParameter } from "../../domain"
import {
  parametersFromObject,
  typedParameters,
  untypedParameters,
} from "./parameters"

const parameters: RPCFunctionParameter[] = [
  {
    name: "first",
    index: 0,
    value: { type: JSType.number },
  },
  {
    name: "second",
    index: 1,
    value: { type: JSType.string },
  },
]

describe("typedParameters", () => {
  test("single parameter", () => {
    expect(typedParameters({ parameters: [parameters[0]] })).toMatchSnapshot()
  })

  test("multiple parameters", () => {
    expect(typedParameters({ parameters })).toMatchSnapshot()
  })
})

describe("untypedParameters", () => {
  test("single parameter", () => {
    expect(untypedParameters({ parameters: [parameters[0]] })).toMatchSnapshot()
  })

  test("multiple parameters", () => {
    expect(untypedParameters({ parameters })).toMatchSnapshot()
  })
})

describe("parametersFromObject", () => {
  test("single parameter", () => {
    expect(
      parametersFromObject({ objectName: "body", parameters: [parameters[0]] }),
    ).toMatchSnapshot()
  })

  test("multiple parameters", () => {
    expect(
      parametersFromObject({ objectName: "body", parameters }),
    ).toMatchSnapshot()
  })
})
