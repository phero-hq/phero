import { RPCFunctionParameter } from "../domain/manifest"
import { JSType, JSValue } from "../domain/JSValue"
import generateClientSDK, { transformToClientSDK } from "./generateClientSDK"

describe("rpcFunctions", () => {
  describe("return type", () => {
    const gen = (returnType: JSValue): string =>
      transformToClientSDK({
        models: {},
        refs: {},
        rpcFunctions: [
          {
            name: "something",
            parameters: [],
            returnType,
            modelIds: [],
            filePath: {
              sourceFile: "src/something.ts",
              outputFile: "build/something.js",
            },
          },
        ],
      })

    test("string", () => {
      expect(gen({ type: JSType.string })).toMatchSnapshot()
    })

    test("number", () => {
      expect(gen({ type: JSType.number })).toMatchSnapshot()
    })

    test("boolean", () => {
      expect(gen({ type: JSType.boolean })).toMatchSnapshot()
    })

    test("object", () => {
      expect(
        gen({
          type: JSType.object,
          properties: [
            { name: "a", type: JSType.boolean },
            { name: "b", type: JSType.string },
          ],
        }),
      ).toMatchSnapshot()
    })

    test("array", () => {
      expect(
        gen({ type: JSType.array, elementType: { type: JSType.number } }),
      ).toMatchSnapshot()
    })

    test("date", () => {
      expect(gen({ type: JSType.date })).toMatchSnapshot()
    })

    test("null", () => {
      expect(gen({ type: JSType.null })).toMatchSnapshot()
    })

    test("undefined", () => {
      expect(gen({ type: JSType.undefined })).toMatchSnapshot()
    })

    test("oneOfTypes", () => {
      expect(
        gen({
          type: JSType.oneOfTypes,
          oneOfTypes: [{ type: JSType.boolean }, { type: JSType.string }],
        }),
      ).toMatchSnapshot()
    })

    test("tuple", () => {
      expect(
        gen({
          type: JSType.tuple,
          elementTypes: [
            { type: JSType.date },
            { type: JSType.array, elementType: { type: JSType.number } },
          ],
        }),
      ).toMatchSnapshot()
    })

    test("ref", () => {
      const code = transformToClientSDK({
        models: {
          Something: {
            id: "Something",
            ts: "interface Something { x: boolean }",
          },
        },
        refs: {
          Something: {
            id: "Something",
            modelId: "Something",
            value: {
              type: JSType.object,
              properties: [
                {
                  name: "x",
                  type: JSType.boolean,
                },
              ],
            },
          },
        },
        rpcFunctions: [
          {
            name: "something",
            parameters: [],
            returnType: { type: JSType.ref, id: "Something" },
            modelIds: [],
            filePath: {
              sourceFile: "src/something.ts",
              outputFile: "build/something.js",
            },
          },
        ],
      })

      expect(code).toMatchSnapshot()
    })

    test("untyped", () => {
      expect(gen({ type: JSType.untyped })).toMatchSnapshot()
    })
  })

  describe("parameters", () => {
    const gen = (parameters: RPCFunctionParameter[]): string =>
      transformToClientSDK({
        rpcFunctions: [
          {
            name: "something",
            parameters,
            returnType: { type: JSType.untyped },
            modelIds: [],
            filePath: {
              sourceFile: "src/something.ts",
              outputFile: "build/something.js",
            },
          },
        ],
        models: {},
        refs: {},
      })

    test("string", () => {
      expect(
        gen([{ name: "a", index: 0, value: { type: JSType.string } }]),
      ).toMatchSnapshot()
    })

    test("number", () => {
      expect(
        gen([{ name: "a", index: 0, value: { type: JSType.number } }]),
      ).toMatchSnapshot()
    })

    test("boolean", () => {
      expect(
        gen([{ name: "a", index: 0, value: { type: JSType.boolean } }]),
      ).toMatchSnapshot()
    })

    test("object", () => {
      expect(
        gen([
          {
            name: "a",
            index: 0,
            value: {
              type: JSType.object,
              properties: [{ name: "a", type: JSType.number }],
            },
          },
        ]),
      ).toMatchSnapshot()
    })

    test("array", () => {
      expect(
        gen([
          {
            name: "a",
            index: 0,
            value: { type: JSType.array, elementType: { type: JSType.number } },
          },
        ]),
      ).toMatchSnapshot()
    })

    test("date", () => {
      expect(
        gen([{ name: "a", index: 0, value: { type: JSType.date } }]),
      ).toMatchSnapshot()
    })

    test("null", () => {
      expect(
        gen([{ name: "a", index: 0, value: { type: JSType.null } }]),
      ).toMatchSnapshot()
    })

    test("undefined", () => {
      expect(
        gen([{ name: "a", index: 0, value: { type: JSType.undefined } }]),
      ).toMatchSnapshot()
    })

    test("oneOfTypes", () => {
      expect(
        gen([
          {
            name: "a",
            index: 0,
            value: {
              type: JSType.oneOfTypes,
              oneOfTypes: [{ type: JSType.boolean }, { type: JSType.number }],
            },
          },
        ]),
      ).toMatchSnapshot()
    })

    test("tuple", () => {
      expect(
        gen([
          {
            name: "a",
            index: 0,
            value: {
              type: JSType.tuple,
              elementTypes: [{ type: JSType.date }, { type: JSType.boolean }],
            },
          },
        ]),
      ).toMatchSnapshot()
    })

    test("ref", () => {
      const code = transformToClientSDK({
        models: {
          Something: {
            id: "Something",
            ts: "interface Something { x: boolean }",
          },
        },
        refs: {
          Something: {
            id: "Something",
            modelId: "Something",
            value: {
              type: JSType.object,
              properties: [
                {
                  name: "x",
                  type: JSType.boolean,
                },
              ],
            },
          },
        },
        rpcFunctions: [
          {
            name: "something",
            parameters: [
              {
                index: 0,
                name: "a",
                value: {
                  type: JSType.ref,
                  id: "Something",
                },
              },
            ],
            returnType: { type: JSType.untyped },
            modelIds: ["Something"],
            filePath: {
              sourceFile: "src/something.ts",
              outputFile: "build/something.js",
            },
          },
        ],
      })
      expect(code).toMatchSnapshot()
    })

    test("no parameters", () => {
      expect(gen([])).toMatchSnapshot()
    })

    test("multiple parameters", () => {
      expect(
        gen([
          { name: "a", index: 0, value: { type: JSType.number } },
          { name: "b", index: 1, value: { type: JSType.string } },
        ]),
      ).toMatchSnapshot()
    })
  })
})
