import ts from "typescript"
import {
  compileProgram,
  compileStatement,
  compileStatements,
} from "../tsTestUtils"
import recursivelyFindThrowStatements from "./recursivelyFindThrowStatements"

describe("recursivelyFindThrowStatements", () => {
  describe("statements", () => {
    test("top level", () => {
      const { statement: func, typeChecker } = compileStatement(
        `
      function func(a: string): boolean {
        throw new Error('error')
        return true
      }`,
        ts.SyntaxKind.FunctionDeclaration,
      )
      expect(recursivelyFindThrowStatements(func, typeChecker)).toHaveLength(1)
    })

    test("if statement", () => {
      const { statement: func, typeChecker } = compileStatement(
        `
      function func(a: string): boolean {
        if (a == "x") {
          throw new Error('error')
        }
        return true
      }`,
        ts.SyntaxKind.FunctionDeclaration,
      )
      expect(recursivelyFindThrowStatements(func, typeChecker)).toHaveLength(1)
    })

    test("nested if statement", () => {
      const { statement: func, typeChecker } = compileStatement(
        `
      function func(a: string): boolean {
        if (a == "x") {
          if (aa != "y") {
            throw new Error('error')
          }
        }
        return true
      }`,
        ts.SyntaxKind.FunctionDeclaration,
      )
      expect(recursivelyFindThrowStatements(func, typeChecker)).toHaveLength(1)
    })

    test("for-i statement", () => {
      const { statement: func, typeChecker } = compileStatement(
        `
      function func(a: string): boolean {
        for (let i = 0; i < a.length; i++) {
          throw new Error('error')
        }
        return true
      }`,
        ts.SyntaxKind.FunctionDeclaration,
      )
      expect(recursivelyFindThrowStatements(func, typeChecker)).toHaveLength(1)
    })

    test("for-of statement", () => {
      const { statement: func, typeChecker } = compileStatement(
        `
      function func(a: string): boolean {
        for (const c of a) {
          throw new Error('error')
        }
        return true
      }`,
        ts.SyntaxKind.FunctionDeclaration,
      )
      expect(recursivelyFindThrowStatements(func, typeChecker)).toHaveLength(1)
    })

    test("for-in statement", () => {
      const { statement: func, typeChecker } = compileStatement(
        `
      function func(a: string): boolean {
        for (const c in a) {
          throw new Error('error')
        }
        return true
      }`,
        ts.SyntaxKind.FunctionDeclaration,
      )
      expect(recursivelyFindThrowStatements(func, typeChecker)).toHaveLength(1)
    })

    test("do-while statement", () => {
      const { statement: func, typeChecker } = compileStatement(
        `
      function func(a: string): boolean {
        do {
          throw new Error('error')
        } while (a.length)
        return true
      }`,
        ts.SyntaxKind.FunctionDeclaration,
      )
      expect(recursivelyFindThrowStatements(func, typeChecker)).toHaveLength(1)
    })

    test("while statement", () => {
      const { statement: func, typeChecker } = compileStatement(
        `
      function func(a: string): boolean {
        while (a.length) {
          throw new Error('error')
        }
        return true
      }`,
        ts.SyntaxKind.FunctionDeclaration,
      )
      expect(recursivelyFindThrowStatements(func, typeChecker)).toHaveLength(1)
    })

    test("with statement", () => {
      const { statement: func, typeChecker } = compileStatement(
        `
      function func(a: string): boolean {
        with (a) {
          throw new Error('error')
        }
        return true
      }`,
        ts.SyntaxKind.FunctionDeclaration,
      )
      expect(recursivelyFindThrowStatements(func, typeChecker)).toHaveLength(1)
    })

    test("switch statement", () => {
      const { statement: func, typeChecker } = compileStatement(
        `
      function func(a: string): boolean {
        switch (a) {
          case "a":
            throw new Error('error')
          case "b":
            return true;
          case "c":
              throw new Error('error')
          default:
              throw new Error('error')
        }
        return true
      }`,
        ts.SyntaxKind.FunctionDeclaration,
      )
      expect(recursivelyFindThrowStatements(func, typeChecker)).toHaveLength(3)
    })

    test("labeled statement", () => {
      const { statement: func, typeChecker } = compileStatement(
        `
      function func(a: string): boolean {
        kaas: switch (a) {
          case "a":
            throw new Error('error')
        }
        return true
      }`,
        ts.SyntaxKind.FunctionDeclaration,
      )
      expect(recursivelyFindThrowStatements(func, typeChecker)).toHaveLength(1)
    })

    test("try statement", () => {
      const { statement: func, typeChecker } = compileStatement(
        `
      function func(a: string): boolean {
        try {
          throw new Error('error')
        } catch (e) {
          if (a == "x") {
            throw new Error('error')
          }
        } finally {
          if (a == "y") {
            throw new Error('error')
          }
        }
        return true
      }`,
        ts.SyntaxKind.FunctionDeclaration,
      )
      expect(recursivelyFindThrowStatements(func, typeChecker)).toHaveLength(3)
    })
  })

  describe("in other functions", () => {
    test("top level", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        funcTwo("y");
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("if statement", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        if (funcTwo(a)) {
          return true
        }
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("do-while statement", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        do {
          return true
        } while (funcTwo(a))
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("while statement", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        while (funcTwo(a)) {
          return true
        } 
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("return statement", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        return funcTwo(a)
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("with statement", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        with (funcTwo(a)) {
          return true
        }
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("variable statement", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        const x = "a", y = funcTwo(a);
        
        return true
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("for-i statement", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        for (let i = funcTwo(a); i ; i = false) {
          return false
        }
        
        return true
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("for-i statement", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        for (let i = 0; funcTwo(a) ; i++) {
          return false
        }
        
        return true
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("for-i statement", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        for (let i = 0; i < 3; i + funcTwo(a) ? 1 : 0) {
          return false
        }
        
        return true
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("for-of statement", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        for (const x of funcTwo(a)) {
          return false
        }
        
        return true
      }

      function funcTwo(a: string): string[] {
        throw new Error('error')
        return []
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })
    test("for-in statement", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        for (const x in funcTwo(a)) {
          return false
        }
        
        return true
      }

      function funcTwo(a: string): string[] {
        throw new Error('error')
        return []
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("switch statement", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        switch (funcTwo(a)) {
          case true: return false;
          case false: return true;
        }
        
        return true
      }

      function funcTwo(a: string): string[] {
        throw new Error('error')
        return []
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("switch statement", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        switch (a) {
          case "a": return false;
          case funcTwo(a): return true;
        }
        
        return true
      }

      function funcTwo(a: string): string[] {
        throw new Error('error')
        return []
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })
    test("try statement", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        try {
        } catch (e = funcTwo(a)) {
        }
        
        return true
      }

      function funcTwo(a: string): string[] {
        throw new Error('error')
        return []
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })
  })

  describe("expressions", () => {
    test("yield expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function* funcOne(a: string): boolean {
        yield funcTwo(a)
        
        return true
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("binary expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        if (funcTwo(a) && false) {

        }
        
        return true
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("binary expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        if (false && funcTwo(a)) {

        }
        
        return true
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("conditional expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        return funcTwo(a) ? true : false;
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("conditional expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        return true ? funcTwo(a) : false;
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("conditional expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        return true ? true : funcTwo(a);
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("prefix unary expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        if (!funcTwo(a)) { 
        }
        return true
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("postfix unary expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        if (funcTwo(a)++ === 1) {
        }
        return true
      }

      function funcTwo(a: string): number {
        throw new Error('error')
        return 1
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("delete expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        delete funcTwo(a)
        return true
      }

      function funcTwo(a: string): number {
        throw new Error('error')
        return 1
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("typeof expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        if (typeof funcTwo(a) == "number") {
          return false
        }
        return true
      }

      function funcTwo(a: string): number {
        throw new Error('error')
        return 1
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("void expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        void funcTwo(a)
        return true
      }

      function funcTwo(a: string): number {
        throw new Error('error')
        return 1
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("await expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      async function funcOne(a: string): boolean {
        await funcTwo(a)
        return true
      }

      function funcTwo(a: string): number {
        throw new Error('error')
        return 1
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("template expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        if (\`\${funcTwo(a)}\` == "1") {
          return false
        }
        return true
      }

      function funcTwo(a: string): number {
        throw new Error('error')
        return 1
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("parenthesis expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        if ( (funcTwo(a) == true) ) {
          return false
        }
        return true
      }

      function funcTwo(a: string): number {
        throw new Error('error')
        return 1
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("property access expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        return [false, funcTwo(a), true].length == 3
      }

      function funcTwo(a: string): number {
        throw new Error('error')
        return 1
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("element access expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        return [false, funcTwo(a), true][1] == true
      }

      function funcTwo(a: string): number {
        throw new Error('error')
        return 1
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("array literal expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean[] {
        return [false, funcTwo(a), true]
      }

      function funcTwo(a: string): number {
        throw new Error('error')
        return 1
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("spread element expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        const [one, two] = [true, ...funcTwo(a)]
        return one
      }

      function funcTwo(a: string): boolean[] {
        throw new Error('error')
        return [true, false]
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("object literal expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        const obj = {
          x: funcTwo(a),
        }
        return obj.x
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("external object literal expression", () => {
      const {
        statements: [, funcOne],
        typeChecker,
      } = compileStatements(
        `
      const obj = {
        x: funcTwo,
      }

      function funcOne(a: string): boolean {
        return obj.x(a)
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("external 2 object literal expression", () => {
      const {
        statements: [, funcOne],
        typeChecker,
      } = compileStatements(
        `
        const obj = {
          aad: {
        x: funcTwo,
          },
      }
        function funcOne(a: string): boolean {
        const obj2 = obj.aad
        const obj3 = obj2
        return obj3["x"](a)
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("external 3 object literal expression", () => {
      const {
        statements: [, funcOne],
        typeChecker,
      } = compileStatements(
        `
        const obj = {
          
        x: funcTwo,
          
      }
        function funcOne(a: string): boolean {
        return obj["x"](a)
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("external 4 object literal expression", () => {
      const {
        statements: [, funcOne],
        typeChecker,
      } = compileStatements(
        `
        const obj = [{  
          x: funcTwo,    
        }]
      
        function funcOne(a: string): boolean {
        return obj[0]["x"](a)
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("object literal expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        const obj = {
          x: {
            y: { 
              z: [true, funcTwo(a)],
            }
          }
        }
        return obj.x.y.z[1]
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("type assertion expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): string {
        return <string> funcTwo(a)
      }

      function funcTwo(a: string): 'x' {
        throw new Error('error')
        return 'x'
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("call expression", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        return funcThree(funcTwo("a"))
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }

      function funcThree(b: boolean): boolean {
        return b
      }
      // function funcThree(f: (a: string) => boolean): boolean {
      //   return f("x")
      // }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("call expression, higher order function", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        return funcThree(funcTwo)
      }

      function funcTwo(a: string): boolean {
        throw new Error('error')
        return true
      }

      function funcThree(f: (a: string) => boolean): boolean {
        return f("x")
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })
  })

  describe("classes", () => {
    test("from an other constructor", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        if (a == "x") {
          new Aap()
        }
      }

      class Aap {
        constructor(x: string) {
          if (x === "y") {
            throw new Error("error")
          }
        }
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("from a super constructor", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        if (a == "x") {
          new Aap("x")
        }
        return true
      }

      class Gorilla {
        constructor(x: string) {
          if (x === "y") {
            throw new Error("error")
          }
        }
      }

      class Aap extends Gorilla {
        constructor(x: string) {
          super(x);
          if (x === "y") {
            throw new Error("error")
          }
        }
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(2)
    })

    test("methods", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        if (a == "x") {
          new Aap().test()
        }
      }

      class Aap {
        constructor(private x: string) {
        }

        test() {
          if (this.x === "y") {
            throw new Error("error")
          }
        }
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("method and constructor", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
      function funcOne(a: string): boolean {
        if (a == "x") {
          new Aap().test()
        }
      }

      class Aap {
        constructor(private x: string) {
          throw new Error("error 1")
        }

        test() {
          if (this.x === "y") {
            throw new Error("error 2")
          }
        }
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(2)
    })
  })

  describe("lambda and inner function", () => {
    test("ignore never called lambda", () => {
      const { statement: funcOne, typeChecker } = compileStatement(
        `
      function funcOne(a: string): boolean {
        const x = () => {
          throw new Error('error')
        }
        return true;
      }
    `,
        ts.SyntaxKind.FunctionDeclaration,
      )

      expect(recursivelyFindThrowStatements(funcOne, typeChecker)).toHaveLength(
        0,
      )
    })

    test("called lambda", () => {
      const { statement: funcOne, typeChecker } = compileStatement(
        `
      function funcOne(a: string): boolean {
        const x = () => {
          throw new Error('error')
        }
        return x();
      }
    `,
        ts.SyntaxKind.FunctionDeclaration,
      )

      expect(recursivelyFindThrowStatements(funcOne, typeChecker)).toHaveLength(
        1,
      )
    })
    test("called inner lambda", () => {
      const { statement: funcOne, typeChecker } = compileStatement(
        `
      function funcOne(a: string): boolean {
        
        const y = () => {
          throw new Error('error')
        }
        const x = () => y()
        
        return x();
      }
    `,
        ts.SyntaxKind.FunctionDeclaration,
      )

      expect(recursivelyFindThrowStatements(funcOne, typeChecker)).toHaveLength(
        1,
      )
    })
    test("called function expressions", () => {
      const { statement: funcOne, typeChecker } = compileStatement(
        `
      function funcOne(a: string): boolean {
        
        const y = function() {
          throw new Error('error')
        }
        const x = () => y()
        
        return x();
      }
    `,
        ts.SyntaxKind.FunctionDeclaration,
      )

      expect(recursivelyFindThrowStatements(funcOne, typeChecker)).toHaveLength(
        1,
      )
    })
    test("called inner functions", () => {
      const { statement: funcOne, typeChecker } = compileStatement(
        `
      function funcOne(a: string): boolean {
        
        function y() {
          throw new Error('error')
        }
        const x = () => y()
        
        return x();
      }
    `,
        ts.SyntaxKind.FunctionDeclaration,
      )

      expect(recursivelyFindThrowStatements(funcOne, typeChecker)).toHaveLength(
        1,
      )
    })
    test("ignore never called function", () => {
      const { statement: funcOne, typeChecker } = compileStatement(
        `
      function funcOne(a: string): boolean {
        function inner() {
          throw new Error('error')
        }
        return true;
      }
    `,
        ts.SyntaxKind.FunctionDeclaration,
      )

      expect(recursivelyFindThrowStatements(funcOne, typeChecker)).toHaveLength(
        0,
      )
    })

    test("called function", () => {
      const { statement: funcOne, typeChecker } = compileStatement(
        `
      function funcOne(a: string): boolean {
        function inner() {
          throw new Error('error')
        }
        return inner();
      }
    `,
        ts.SyntaxKind.FunctionDeclaration,
      )

      expect(recursivelyFindThrowStatements(funcOne, typeChecker)).toHaveLength(
        1,
      )
    })
  })

  describe("external imports", () => {
    test("default import", () => {
      const {
        statements: [, funcOne],
        typeChecker,
      } = compileStatements(
        `
        import aad from "aad"

      function funcOne(a: string): boolean {
        return aad();
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(0)
    })

    test("named import", () => {
      const {
        statements: [, funcOne],
        typeChecker,
      } = compileStatements(
        `
        import {aad} from "aad"

      function funcOne(a: string): boolean {
        return aad();
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(0)
    })

    test("aliased import", () => {
      const {
        statements: [, funcOne],
        typeChecker,
      } = compileStatements(
        `
        import {aad as aap} from "aad"

      function funcOne(a: string): boolean {
        return aap();
      }
    `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(0)
    })
  })

  describe("internal imports", () => {
    test("default import", () => {
      const {
        statements: [, funcOne],
        typeChecker,
      } = compileProgram({
        phero: `
        import aad from "./aad"

          function funcOne(a: string): boolean {
            return aad();
          }
        `,
        aad: `
        export default function aad(): number {
          throw new Error('error)
        }
        `,
      })

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("named import", () => {
      const {
        statements: [, funcOne],
        typeChecker,
      } = compileProgram({
        phero: `
        import {aad} from "./aad"

          function funcOne(a: string): boolean {
            return aad();
          }
        `,
        aad: `
        export function aad(): number {
          throw new Error('error)
        }
        `,
      })

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })

    test("aliased import", () => {
      const {
        statements: [, funcOne],
        typeChecker,
      } = compileProgram({
        phero: `
        import {aad as noot} from "./aad"

          function funcOne(a: string): boolean {
            return noot();
          }
        `,
        aad: `
        export function aad(): number {
          throw new Error('error)
        }
        `,
      })

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })
  })

  describe("duplicates", () => {
    test("ignore duplicate", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
          function funcOne(a: string): boolean {
            const x = [funcTwo(), funcTwo()]
            return x[0];
          }
          function funcTwo(): boolean {
            throw new Error('error')
          }
        `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })
  })

  describe("Promise", () => {
    test("new Promise", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
          async function funcOne(a: string): boolean {
            const x = await Promise.all([funcTwo()])
            return x[0];
          }
          async function funcTwo(): Promise<boolean> {
            return new Promise((resolve, reject) => {
              throw new Error('error')
            })
          }
        `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })
    test.skip("new Promise with reject", () => {
      const {
        statements: [funcOne],
        typeChecker,
      } = compileStatements(
        `
          async function funcOne(a: string): boolean {
            const x = await Promise.all([funcTwo()])
            return x[0];
          }
          async function funcTwo(): Promise<boolean> {
            return new Promise((resolve, reject) => {
              reject(new Error('error'))
            })
          }
        `,
      )

      expect(
        recursivelyFindThrowStatements(
          funcOne as ts.FunctionDeclaration,
          typeChecker,
        ),
      ).toHaveLength(1)
    })
  })
})
