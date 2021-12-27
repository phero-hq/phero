import ts from "typescript"
import { compileStatement, compileStatements, printCode } from "../tsTestUtils"
import { generateKeyValidator } from "./parsers/generateKeyValidator"

import generateParserModel from "./parsers/generateParserModel"

describe("test validation", () => {
  test("test", () => {
    const {
      statements: [model],
      typeChecker,
    } = compileStatements(
      `
          interface MyModel {
            props: {
              [prop in keyof MyOtherModel]: number
            }
          }

          interface MyOtherModel {
            kaas: number
            koos: string  
          }
        `,
    )

    // const parserModel = generateParserModel(typeChecker, model, "data")
    // console.log(JSON.stringify(parserModel, null, 4))

    // const keyParser = (parserModel as any).parser.members[0].parser.members[0]
    //   .keyParser
    // console.log(JSON.stringify(keyParser, null, 4))
    // const validator = generateKeyValidator(keyParser, [
    //   parserModel,
    //   (parserModel as any).parser,
    //   (parserModel as any).parser.members[0],
    //   (parserModel as any).parser.members[0].parser,
    //   (parserModel as any).parser.members[0].parser.members[0],
    // ])
    // console.log(printCode(validator))

    // expect(printCode(validator)).toMatchSnapshot()
  })
})

// interface MyModel {
//   arr: {
//     [aad in keyof Aad]: number
//   }
// }

// type XXX = keyof Aad

// enum Aad {
//   X = "x",
//   Y = "y",
//   Z = "z",
// }

// interface Kees {
//   kaas: {
//     x: number
//   }
//   koos: {
//     x: number
//   }
//   // [x: string]: {
//   //   x: number
//   // }
// }

// const x: MyModel = {
//   arr: {
//     // kaas: 1,
//     // koos: 2,
//     // x: 1,
//     // y: 1,

//     substring: 1,
//   },
// }
