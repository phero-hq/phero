import { Project } from "ts-morph"
import generateManifest from "./generateManifest"
import { JSType } from "../domain/JSValue"
import { RPCFunction, SamenManifest } from "../domain/manifest"

function getCompiledSamenFile(tsContent: string): SamenManifest {
  const project = new Project()
  const samenFile = project.createSourceFile("samen.ts", tsContent)
  const r = generateManifest(samenFile, project.getTypeChecker())
  return r
}

function getCompiledSamenFunction(tsContent: string): RPCFunction {
  const project = new Project()
  const samenFile = project.createSourceFile("samen.ts", tsContent)
  const r = generateManifest(samenFile, project.getTypeChecker())
  expect(r.rpcFunctions).toHaveLength(1)
  return r.rpcFunctions[0]
}

describe("compile SamenFile", () => {
  test("extracts all exported functions", () => {
    const r = getCompiledSamenFunction(`
    export async function myFunction(): Promise<number> {
      return 1;
    }
    function notExported(): number {
      return 1;
    }
  `)
    expect(r).toMatchObject({
      name: "myFunction",
      parameters: [],
      returnType: { type: JSType.number },
      modelIds: [],
    })
  })

  describe("extract parameters", () => {
    test("extracts parameters with correct JSValue", () => {
      const r = getCompiledSamenFunction(`
    export async function myFunction(myParam: number, mySecondParam: string): Promise<number> {
      return 1;
    }
  `)
      const func = {
        name: "myFunction",
        parameters: [
          {
            name: "myParam",
            index: 0,
            value: { type: JSType.number },
          },
          {
            name: "mySecondParam",
            index: 1,
            value: { type: JSType.string },
          },
        ],
        returnType: { type: JSType.number },
        modelIds: [],
      }
      expect(r).toMatchObject(func)
    })

    test("extracts interface typed parameters with correct JSValue", () => {
      const r = getCompiledSamenFile(`
    interface MyDataStructure {
      myProp: number;
    }
    export async function myFunction(myParam: MyDataStructure): Promise<number> {
      return 1;
    }
  `)

      expect(r.rpcFunctions[0].parameters).toMatchObject([
        {
          name: "myParam",
          index: 0,
          value: {
            type: JSType.ref,
            id: "MyDataStructure",
          },
        },
      ])

      expect(Object.keys(r.refs)).toMatchObject(["MyDataStructure"])

      expect(r.refs.MyDataStructure).toMatchObject({
        id: "MyDataStructure",
        modelId: "MyDataStructure",
        value: expect.objectContaining({
          type: JSType.object,
          properties: expect.arrayContaining([
            {
              name: "myProp",
              type: JSType.number,
            },
          ]),
        }),
      })
    })

    test("extracts generic interface typed parameters with correct JSValue", () => {
      const r = getCompiledSamenFile(`
    interface MyDataStructure<T> {
      myProp: T;
    }
    export async function myFunction(myParam: MyDataStructure<number>): Promise<number> {
      return 1;
    }
  `)

      expect(r.rpcFunctions[0].parameters).toMatchObject([
        {
          name: "myParam",
          index: 0,
          value: {
            type: JSType.ref,
            id: "MyDataStructure<number>",
          },
        },
      ])

      expect(Object.keys(r.refs)).toMatchObject(["MyDataStructure<number>"])

      expect(r.refs["MyDataStructure<number>"]).toMatchObject({
        id: "MyDataStructure<number>",
        modelId: "MyDataStructure",
        value: expect.objectContaining({
          type: JSType.object,
          properties: expect.arrayContaining([
            {
              name: "myProp",
              type: JSType.number,
            },
          ]),
        }),
      })
    })

    test("extracts wrapped generic interface typed parameters with correct JSValue", () => {
      const r = getCompiledSamenFile(`
    interface OtherStructure<A> {
      otherProp: A
    }
    interface MyDataStructure<T> {
      myProp: T;
    }
    export async function myFunction(myParam: MyDataStructure<OtherStructure<number>>): Promise<number> {
      return 1;
    }
  `)

      expect(r.rpcFunctions[0].parameters).toMatchObject([
        {
          name: "myParam",
          index: 0,
          value: {
            type: JSType.ref,
            id: "MyDataStructure<OtherStructure<number>>",
          },
        },
      ])

      expect(Object.keys(r.refs)).toMatchObject([
        "MyDataStructure<OtherStructure<number>>",
        "OtherStructure<number>",
      ])

      expect(r.refs["MyDataStructure<OtherStructure<number>>"]).toMatchObject({
        id: "MyDataStructure<OtherStructure<number>>",
        modelId: "MyDataStructure",
        value: expect.objectContaining({
          type: JSType.object,
          properties: expect.arrayContaining([
            {
              name: "myProp",
              type: JSType.ref,
              id: "OtherStructure<number>",
            },
          ]),
        }),
      })

      expect(r.refs["OtherStructure<number>"]).toMatchObject({
        id: "OtherStructure<number>",
        modelId: "OtherStructure",
        value: expect.objectContaining({
          type: JSType.object,
          properties: expect.arrayContaining([
            {
              name: "otherProp",
              type: JSType.number,
            },
          ]),
        }),
      })
    })

    test("extracts literal number parameters with correct JSValue", () => {
      const r = getCompiledSamenFunction(`
    export async function myFunction(myParam: 1): Promise<number> {
      return 1;
    }
  `)
      const func = {
        name: "myFunction",
        parameters: [
          {
            name: "myParam",
            index: 0,
            value: {
              type: JSType.number,
              oneOf: [1],
            },
          },
        ],
        returnType: { type: JSType.number },
        modelIds: [],
      }
      expect(r).toMatchObject(func)
    })

    test("extracts literal string parameters with correct JSValue", () => {
      const r = getCompiledSamenFunction(`
    export async function myFunction(myParam: 'str'): Promise<number> {
      return 1;
    }
  `)
      const func = {
        name: "myFunction",
        parameters: [
          {
            name: "myParam",
            index: 0,
            value: {
              type: JSType.string,
              oneOf: ["str"],
            },
          },
        ],
        returnType: { type: JSType.number },
        modelIds: [],
      }
      expect(r).toMatchObject(func)
    })

    test("extracts literal boolean parameters with correct JSValue", () => {
      const r = getCompiledSamenFunction(`
    export async function myFunction(myParam: false): Promise<number> {
      return 1;
    }
  `)
      const func = {
        name: "myFunction",
        parameters: [
          {
            name: "myParam",
            index: 0,
            value: {
              type: JSType.boolean,
              oneOf: [false],
            },
          },
        ],
        returnType: { type: JSType.number },
        modelIds: [],
      }
      expect(r).toMatchObject(func)
    })

    test("extracts undefined parameters with correct JSValue", () => {
      const r = getCompiledSamenFunction(`
    export async function myFunction(myParam: undefined): Promise<number> {
      return 1;
    }
  `)
      const func = {
        name: "myFunction",
        parameters: [
          {
            name: "myParam",
            index: 0,
            value: {
              type: JSType.undefined,
            },
          },
        ],
        returnType: { type: JSType.number },
        modelIds: [],
      }
      expect(r).toMatchObject(func)
    })

    test("extracts null parameters with correct JSValue", () => {
      const r = getCompiledSamenFunction(`
    export async function myFunction(myParam: null): Promise<number> {
      return 1;
    }
  `)
      const func = {
        name: "myFunction",
        parameters: [
          {
            name: "myParam",
            index: 0,
            value: {
              type: JSType.null,
            },
          },
        ],
        returnType: { type: JSType.number },
        modelIds: [],
      }
      expect(r).toMatchObject(func)
    })

    test("extracts unknown parameters with correct JSValue", () => {
      const r = getCompiledSamenFunction(`
    export async function myFunction(myParam: unknown): Promise<number> {
      return 1;
    }
  `)
      const func = {
        name: "myFunction",
        parameters: [
          {
            name: "myParam",
            index: 0,
            value: {
              type: JSType.untyped,
            },
          },
        ],
        returnType: { type: JSType.number },
        modelIds: [],
      }
      expect(r).toMatchObject(func)
    })

    test("extracts tuple parameters with correct JSValue", () => {
      const r = getCompiledSamenFunction(`
    export async function myFunction(myParam: [number, string]): Promise<number> {
      return 1;
    }
  `)
      const func = {
        name: "myFunction",
        parameters: [
          {
            name: "myParam",
            index: 0,
            value: {
              type: JSType.tuple,
              elementTypes: [{ type: JSType.number }, { type: JSType.string }],
            },
          },
        ],
        returnType: { type: JSType.number },
        modelIds: [],
      }
      expect(r).toMatchObject(func)
    })

    test("extracts generic tuple parameters with correct JSValue", () => {
      const r = getCompiledSamenFunction(`
    type MyParamType<T> = [T, number];

    export async function myFunction(myParam: MyParamType<string>): Promise<number> {
      return 1;
    }
  `)
      const func = {
        name: "myFunction",
        parameters: [
          {
            name: "myParam",
            index: 0,
            value: {
              type: JSType.tuple,
              elementTypes: [{ type: JSType.string }, { type: JSType.number }],
            },
          },
        ],
        returnType: { type: JSType.number },
      }
      expect(r).toMatchObject(func)
    })

    test("extracts union parameters with correct JSValue", () => {
      const r = getCompiledSamenFunction(`
    type SomeUnion = string | number;

    export async function myFunction(myParam: SomeUnion): Promise<number> {
      return 1;
    }
  `)
      const func = {
        name: "myFunction",
        parameters: [
          {
            name: "myParam",
            index: 0,
            value: {
              type: JSType.oneOfTypes,
              oneOfTypes: [{ type: JSType.string }, { type: JSType.number }],
            },
          },
        ],
        returnType: { type: JSType.number },
      }
      expect(r).toMatchObject(func)
    })

    test("extracts generic union parameters with correct JSValue", () => {
      const r = getCompiledSamenFile(`
    type SomeDataStructure<T> = {
      someProp: T
    }

    type SomeUnion<T> = string | SomeDataStructure<T>;

    export async function myFunction(myParam: SomeUnion<string>): Promise<number> {
      return 1;
    }
  `)
      const func = {
        name: "myFunction",
        parameters: [
          {
            name: "myParam",
            index: 0,
            value: {
              type: JSType.oneOfTypes,
              oneOfTypes: [
                { type: JSType.string },
                { type: JSType.ref, id: "SomeDataStructure<string>" },
              ],
            },
          },
        ],
        returnType: { type: JSType.number },
      }
      expect(r.rpcFunctions[0]).toMatchObject(func)
      expect(r.refs).toHaveProperty("SomeDataStructure<string>")
      expect(r.refs["SomeDataStructure<string>"]).toMatchObject({
        id: "SomeDataStructure<string>",
        modelId: "SomeDataStructure",
        value: expect.objectContaining({
          type: JSType.object,
          properties: expect.arrayContaining([
            { name: "someProp", type: JSType.string },
          ]),
        }),
      })
    })

    test("extracts intersection parameters with correct JSValue", () => {
      const r = getCompiledSamenFile(`
    type SomeDataStructure<T> = {
      someProp: T
    }

    type SomeUnion<T> = { prop: number } & SomeDataStructure<T>;

    export async function myFunction(myParam: SomeUnion<string>): Promise<number> {
      return 1;
    }
  `)
      const func = {
        name: "myFunction",
        parameters: [
          {
            name: "myParam",
            index: 0,
            value: {
              type: "ref",
              id: "SomeUnion<string>",
            },
          },
        ],
        returnType: { type: JSType.number },
      }
      expect(r.rpcFunctions[0]).toMatchObject(func)
      expect(r.refs).toHaveProperty("SomeUnion<string>")
      expect(r.refs["SomeUnion<string>"]).toMatchObject({
        id: "SomeUnion<string>",
        modelId: "SomeUnion",
        value: {
          type: JSType.object,
          properties: [
            { name: "prop", type: JSType.number },
            { name: "someProp", type: JSType.string },
          ],
        },
      })
    })

    test("extracts enum string parameters with correct JSValue", () => {
      const r = getCompiledSamenFunction(`
    enum Sizes {
      XS = 'XS',
      S = 'S',
      M = 'M',
      L = 'L',
      XL = 'XL',
    }

    export async function myFunction(myParam: Sizes): Promise<number> {
      return 1;
    }
  `)
      const func = {
        name: "myFunction",
        parameters: [
          {
            name: "myParam",
            index: 0,
            value: { type: JSType.string, oneOf: ["XS", "S", "M", "L", "XL"] },
          },
        ],
        returnType: { type: JSType.number },
      }
      expect(r).toMatchObject(func)
    })

    test("extracts enum number parameters with correct JSValue", () => {
      const r = getCompiledSamenFunction(`
    enum Sizes {
      XS = 1,
      S = 2,
      M = 3,
      L = 4,
      XL = 5,
    }

    export async function myFunction(myParam: Sizes): Promise<number> {
      return 1;
    }
  `)
      const func = {
        name: "myFunction",
        parameters: [
          {
            name: "myParam",
            index: 0,
            value: { type: JSType.number, oneOf: [1, 2, 3, 4, 5] },
          },
        ],
        returnType: { type: JSType.number },
      }
      expect(r).toMatchObject(func)
    })

    test("extracts enum default parameters with correct JSValue", () => {
      const r = getCompiledSamenFunction(`
    enum Sizes {
      XS,
      S,
      M,
      L,
      XL,
    }

    export async function myFunction(myParam: Sizes): Promise<number> {
      return 1;
    }
  `)
      const func = {
        name: "myFunction",
        parameters: [
          {
            name: "myParam",
            index: 0,
            value: {
              type: JSType.number,
              oneOf: [0, 1, 2, 3, 4],
            },
          },
        ],
        returnType: { type: JSType.number },
      }
      expect(r).toMatchObject(func)
    })

    test("extracts enum literal parameters with correct JSValue", () => {
      const r = getCompiledSamenFunction(`
    enum Sizes {
      XS,
      S,
      M,
      L,
      XL,
    }

    export async function myFunction(myParam: Sizes.XS): Promise<number> {
      return 1;
    }
  `)
      const func = {
        name: "myFunction",
        parameters: [
          {
            name: "myParam",
            index: 0,
            value: {
              type: JSType.number,
              oneOf: [0],
            },
          },
        ],
        returnType: { type: JSType.number },
      }
      expect(r).toMatchObject(func)
    })

    test("extracts date parameters with correct JSValue", () => {
      const r = getCompiledSamenFunction(`
    export async function myFunction(myParam: Date): Promise<number> {
      return 1;
    }
  `)
      const func = {
        name: "myFunction",
        parameters: [
          {
            name: "myParam",
            index: 0,
            value: {
              type: JSType.date,
            },
          },
        ],
        returnType: { type: JSType.number },
        modelIds: [],
      }
      expect(r).toMatchObject(func)
    })
  })

  describe("extract return type", () => {
    test("extracts return type with correct JSValue", () => {
      const r = getCompiledSamenFunction(`
    export async function myFunction(): Promise<string> {
      return 'str';
    }
  `)
      const func = {
        name: "myFunction",
        parameters: [],
        returnType: { type: JSType.string },
        modelIds: [],
      }
      expect(r).toMatchObject(func)
    })

    test("extracts object return type with correct JSValue", () => {
      const r = getCompiledSamenFile(`
    interface SomeDataStructure<T> {
      someProp: string;
      someOtherProp: T;
    }
    export async function myFunction(): Promise<SomeDataStructure<Date>> {
      return {
        someProp: 'str',
        someOtherProp: new Date(),
      };
    }
  `)
      const func = {
        name: "myFunction",
        parameters: [],
        returnType: {
          type: JSType.ref,
          id: "SomeDataStructure<Date>",
        },
      }
      expect(r.rpcFunctions[0]).toMatchObject(func)
      expect(r.refs).toHaveProperty("SomeDataStructure<Date>")
      expect(r.refs["SomeDataStructure<Date>"]).toMatchObject({
        id: "SomeDataStructure<Date>",
        modelId: "SomeDataStructure",
        value: {
          type: JSType.object,
          properties: [
            { name: "someProp", type: JSType.string },
            { name: "someOtherProp", type: JSType.date },
          ],
        },
      })
    })

    test("extracts non Promise return type with correct JSValue", () => {
      const r = getCompiledSamenFunction(`
    interface SomeDataStructure<T> {
      someProp: string;
      someOtherProp: T;
    }
    export async function myFunction(): SomeDataStructure<Date> {
      return {
        someProp: 'str',
        someOtherProp: new Date(),
      };
    }
  `)

      expect(r.returnType).toMatchObject({
        type: "ref",
        id: "SomeDataStructure<Date>",
      })
    })
  })
  describe("extract models", () => {
    test("extracts interface models from parameters", () => {
      const r = getCompiledSamenFile(`
    interface SomeDataStructure {
      prop: number
    }
    export async function myFunction(a: SomeDataStructure): Promise<number> {
      return 1;
    }
  `)
      expect(r.rpcFunctions[0].modelIds).toEqual(["SomeDataStructure"])
      expect(r.refs).toHaveProperty("SomeDataStructure")
      expect(r.refs.SomeDataStructure).toMatchObject({
        id: "SomeDataStructure",
        modelId: "SomeDataStructure",
        value: {
          type: "object",
          properties: [
            {
              name: "prop",
              type: "number",
            },
          ],
        },
      })
    })

    test("extracts enum models from parameters", () => {
      const r = getCompiledSamenFile(`
    enum Size { S, M, L }
    export function myFunction(a: Size): number {
      return 1;
    }
  `)
      expect(r.rpcFunctions[0].modelIds).toEqual(["Size"])
      expect(r.rpcFunctions[0].parameters[0]).toMatchObject({
        index: 0,
        name: "a",
        value: {
          type: "number",
          oneOf: [0, 1, 2],
        },
      })
      expect(r.refs).not.toHaveProperty("Size")
    })

    test("extracts type alias models from parameters", () => {
      const r = getCompiledSamenFile(`
    type SomeDataStructure = {
      prop: number
      size: Size
    }
    enum Size { S, M, L }
    export function myFunction(a: SomeDataStructure): number {
      return 1;
    }
  `)

      expect(r.rpcFunctions[0].modelIds).toEqual(["SomeDataStructure", "Size"])
      expect(r.refs).toHaveProperty("SomeDataStructure")
      expect(r.refs.SomeDataStructure).toMatchObject({
        id: "SomeDataStructure",
        modelId: "SomeDataStructure",
        value: {
          type: "object",
          properties: [
            {
              name: "prop",
              type: "number",
            },
            {
              name: "size",

              type: "number",
              oneOf: [0, 1, 2],
            },
          ],
        },
      })
    })

    test("extracts indirect enum models from parameters", () => {
      const r = getCompiledSamenFile(`
    interface SomeDataStructure {
      prop: number
      size: Size
    }
    enum Size { S, M, L }
    export function myFunction(a: SomeDataStructure): number {
      return 1;
    }
  `)

      expect(r.rpcFunctions[0].modelIds).toEqual(["SomeDataStructure", "Size"])
      expect(r.refs).toHaveProperty("SomeDataStructure")
      expect(r.refs.SomeDataStructure).toMatchObject({
        id: "SomeDataStructure",
        modelId: "SomeDataStructure",
        value: {
          type: "object",
          properties: [
            {
              name: "prop",
              type: "number",
            },
            {
              name: "size",

              type: "number",
              oneOf: [0, 1, 2],
            },
          ],
        },
      })
    })

    test("extracts deep nested models from multiple parameters", () => {
      const r = getCompiledSamenFile(`
    enum SomeEnum {
      A,
      B,
      C
    }
    interface DependantInterface {
      propA: SomeEnum
    }
    type SomeAlias<T> = {
      prop1: DependantInterface
    }
    interface SomeDataStructure<T> {
      someProp: string;
      someOtherProp: SomeAlias<T>;
    }
    interface ResultType {
      resultProp: string
    }
    export async function myFunction(a: SomeDataStructure<Date>, b: SomeEnum, c: { result: ResultType }): Promise<number> {
      return {
        result: {
          resultProp: 'result',
        },
      };
    }
  `)

      expect(Object.keys(r.models)).toMatchObject(
        expect.arrayContaining([
          "SomeDataStructure",
          "SomeEnum",
          "SomeAlias",
          "ResultType",
          "DependantInterface",
        ]),
      )

      expect(r.rpcFunctions[0].modelIds).toMatchObject(
        expect.arrayContaining([
          "SomeDataStructure",
          "SomeAlias",
          "DependantInterface",
          "SomeEnum",
          "ResultType",
        ]),
      )
      expect(Object.keys(r.refs)).toMatchObject(
        expect.arrayContaining([
          "SomeDataStructure<Date>",
          "SomeAlias<Date>",
          "DependantInterface",
          "ResultType",
        ]),
      )
    })

    test("show off", () => {
      const r = getCompiledSamenFile(`
    enum SomeEnum {
      A,
      B,
      C
    }

    interface SomeInterface {
      propA: SomeEnum
    }

    export async function myFirstFunction(a: SomeInterface): Promise<number> {
      return 1;
    }

    type SomeAlias<T> = {
      prop1: SomeInterface
      d: Date
    }

    interface ResultType {
      resultProp: string
    }

    export async function mySecondFunction(a: SomeAlias<Date>): Promise<{ result: ResultType }> {
      return {
        result: {
          resultProp: 'result',
        },
      };
    }
  `)

      expect(r.rpcFunctions).toHaveLength(2)
      expect(r.rpcFunctions[0]).toMatchObject({
        name: "myFirstFunction",
        modelIds: expect.arrayContaining(["SomeInterface", "SomeEnum"]),
      })
      expect(r.rpcFunctions[1]).toMatchObject({
        name: "mySecondFunction",
        modelIds: expect.arrayContaining([
          "SomeAlias",
          "SomeInterface",
          "SomeEnum",
          "ResultType",
        ]),
      })

      expect(r.models).toHaveProperty("SomeInterface")
      expect(r.models["SomeInterface"].ts).toMatch(`interface SomeInterface {
      propA: SomeEnum
    }`)

      expect(r.models).toHaveProperty("SomeEnum")
      expect(r.models["SomeEnum"].ts).toMatch(`enum SomeEnum {
      A,
      B,
      C
    }`)
      expect(r.models).toHaveProperty("SomeAlias")
      expect(r.models["SomeAlias"].ts).toMatch(`type SomeAlias<T> = {
      prop1: SomeInterface
      d: Date
    }`)
      expect(r.models).toHaveProperty("ResultType")
      expect(r.models["ResultType"].ts).toMatch(`interface ResultType {
      resultProp: string
    }`)
    })

    test("extract recursive data structures", () => {
      const r = getCompiledSamenFile(`
        type Tree<T> = Branch<T>;
        type TreeNode<T> = Branch<T> | Leaf<T>;
        type Branch<T> = { left?: TreeNode<T>, right?: TreeNode<T> };
        type Leaf<T> = { values: T[] };

        export async function getSomeLeaf(tree: Tree<number>): Promise<Leaf<number>> {
          return { values: [1, 2, 3] };
        }
      `)

      expect(r.rpcFunctions[0].modelIds).toMatchObject(
        // Tree is erased because it's just a direct synonym for Branch
        expect.arrayContaining(["Branch", "Leaf", "TreeNode"]),
      )
      expect(r.rpcFunctions[0].parameters).toHaveLength(1)
      expect(r.rpcFunctions[0].parameters[0].value).toMatchObject({
        type: JSType.ref,
        id: "Branch<number>", // beccause Tree is erased
      })
      expect(r.rpcFunctions[0].returnType).toMatchObject({
        type: JSType.ref,
        id: "Leaf<number>",
      })

      expect(r.models).toMatchObject({
        Leaf: expect.objectContaining({
          id: "Leaf",
          ts: "type Leaf<T> = { values: T[] };",
        }),
      })

      expect(r.refs).toMatchObject({
        ["Leaf<number>"]: {
          id: "Leaf<number>",
          modelId: "Leaf",
          value: expect.objectContaining({
            type: "object",
            properties: expect.arrayContaining([
              expect.objectContaining({
                name: "values",
                type: "array",
                elementType: expect.objectContaining({
                  type: "number",
                }),
              }),
            ]),
          }),
        },
      })
    })
  })

  test("extract different types of generics", () => {
    const r = getCompiledSamenFile(`
        interface SomeStructure<T> {
          a: T
        }

        export async function someFunction(a: SomeStructure<number>, b: SomeStructure<string>): Promise<SomeStructure<Date>> {
          return {
            a: new Date(),
          };
        }
      `)

    expect(r.rpcFunctions[0].modelIds).toMatchObject(
      expect.arrayContaining(["SomeStructure"]),
    )
    expect(r.rpcFunctions[0].parameters).toHaveLength(2)
    expect(r.rpcFunctions[0].parameters[0].value).toMatchObject({
      type: JSType.ref,
      id: "SomeStructure<number>",
    })
    expect(r.rpcFunctions[0].parameters[1].value).toMatchObject({
      type: JSType.ref,
      id: "SomeStructure<string>",
    })
    expect(r.rpcFunctions[0].returnType).toMatchObject({
      type: JSType.ref,
      id: "SomeStructure<Date>",
    })

    expect(r.models).toMatchObject({
      SomeStructure: expect.objectContaining({
        id: "SomeStructure",
        ts: `interface SomeStructure<T> {
          a: T
        }`,
      }),
    })

    expect(r.refs).toMatchObject({
      ["SomeStructure<number>"]: {
        id: "SomeStructure<number>",
        modelId: "SomeStructure",
        value: {
          type: "object",
          properties: [
            {
              name: "a",
              type: "number",
            },
          ],
        },
      },
    })
    expect(r.refs).toMatchObject({
      ["SomeStructure<string>"]: {
        id: "SomeStructure<string>",
        modelId: "SomeStructure",
        value: {
          type: "object",
          properties: [
            {
              name: "a",
              type: "string",
            },
          ],
        },
      },
    })
    expect(r.refs).toMatchObject({
      ["SomeStructure<Date>"]: {
        id: "SomeStructure<Date>",
        modelId: "SomeStructure",
        value: {
          type: "object",
          properties: [
            {
              name: "a",
              type: "date",
            },
          ],
        },
      },
    })
  })
})
