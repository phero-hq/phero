import { JSType, RPCFunctionParameter } from "../../domain"
import functionSignature from "./functionSignature"

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

test("minimal options", () => {
  expect(functionSignature({ name: "testName" })).toMatchSnapshot()
})

test("single paramater", () => {
  expect(
    functionSignature({ name: "testName", parameters: [parameters[0]] }),
  ).toMatchSnapshot()
})

test("multiple paramaters", () => {
  expect(functionSignature({ name: "testName", parameters })).toMatchSnapshot()
})

test("return type", () => {
  expect(
    functionSignature({ name: "testName", returnType: "Promise<number>" }),
  ).toMatchSnapshot()
})
