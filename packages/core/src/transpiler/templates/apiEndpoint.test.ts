import {
  JSType,
  ModelMap,
  RefMap,
  RPCFunction,
  SamenManifest,
} from "../../domain"
import apiEndpoint, { Props } from "./apiEndpoint"
import render from "./render"

const props = (partialRpcFunction: Partial<RPCFunction>): Props => {
  const rpcFunction: RPCFunction = {
    name: "testFunction",
    parameters: [],
    returnType: { type: JSType.untyped },
    modelIds: [],
    filePath: { sourceFile: "test.ts", outputFile: "test.js" },
    ...partialRpcFunction,
  }
  return {
    rpcFunction,
    manifest: {
      rpcFunctions: [rpcFunction],
      models: {
        Something: {
          id: "Something",
          ts: "interface Something { x: number }",
        },
      },
      refs: {
        Something: {
          id: "Something",
          modelId: "Something",
          value: { type: JSType.ref, id: "Something" },
        },
      },
    },
    relativeSamenFilePath: "../samen",
  }
}

test("literal parameter", () => {
  expect(
    render(
      apiEndpoint(
        props({
          parameters: [{ name: "a", index: 0, value: { type: JSType.number } }],
        }),
      ),
    ),
  ).toMatchSnapshot()
})

test("ref parameter", () => {
  expect(
    render(
      apiEndpoint(
        props({
          parameters: [
            {
              name: "a",
              index: 0,
              value: { type: JSType.ref, id: "Something" },
            },
          ],
        }),
      ),
    ),
  ).toMatchSnapshot()
})

test("literal returnType", () => {
  expect(
    render(apiEndpoint(props({ returnType: { type: JSType.string } }))),
  ).toMatchSnapshot()
})

test("ref returnType", () => {
  expect(
    render(
      apiEndpoint(props({ returnType: { type: JSType.ref, id: "Something" } })),
    ),
  ).toMatchSnapshot()
})
