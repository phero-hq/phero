// YES
// ArrayParser
// BooleanParser
// BooleanLiteralParser
// DateParser
// NullParser
// NumberLiteralParser
// NumberParser
// StringLiteralParser
// StringParser
// TupleParser
// UndefinedParser
// UnionParser

// MAYBE
// EnumParser
// ObjectParser
// ReferenceParser
// TypeParameterParser
// VoidParser

// NO
// AnyParser
// IndexMemberParser
// IntersectionParser
// MemberParser
// KeyValidator

interface Person {
  name: string
  age: number
  kids: string[]
}

export const ArrayParser =
  <T>(elementParser: Parser<T>) =>
  (data: unknown): ParseResult<T[]> => {
    const result: T[] = []
    const errors: ParseError[] = []
    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        const elementParseResult = elementParser(data[i])
        if (errors.length === 0 && elementParseResult.ok) {
          result.push(elementParseResult.result)
        } else if (!elementParseResult.ok) {
          errors.push({
            path: i.toString(),
            message: `Element incorrect`,
            errors: elementParseResult.errors,
          })
        }
      }
    } else {
      errors.push({
        message: `Not an array`,
      })
    }
    return errors.length === 0 ? { ok: true, result } : { ok: false, errors }
  }

export const NumberParser = (data: unknown): ParseResult<number> => {
  return typeof data === "number" && !isNaN(data)
    ? { ok: true, result: data }
    : { ok: false, errors: [{ message: "Not a number" }] }
}

export const NumberLiteralParser =
  <T extends number>(values: number[]) =>
  (data: unknown): ParseResult<T> => {
    return typeof data === "number" && values.includes(data)
      ? { ok: true, result: data as T }
      : {
          ok: false,
          errors: [{ message: `Not one of (${values.join(" | ")})` }],
        }
  }

export const StringParser = (data: unknown): ParseResult<string> => {
  return typeof data === "string"
    ? { ok: true, result: data }
    : { ok: false, errors: [{ message: "Not a string" }] }
}

export const StringLiteralParser =
  <T extends string>(values: string[]) =>
  (data: unknown): ParseResult<T> => {
    return typeof data === "string" && values.includes(data)
      ? { ok: true, result: data as T }
      : {
          ok: false,
          errors: [{ message: `Not one of (${values.join(" | ")})` }],
        }
  }

export const BooleanParser = (data: unknown): ParseResult<boolean> => {
  return typeof data === "boolean"
    ? { ok: true, result: data }
    : { ok: false, errors: [{ message: "Not a boolean" }] }
}

export const TrueLiteralParser = (data: unknown): ParseResult<true> => {
  return data === true
    ? { ok: true, result: data }
    : {
        ok: false,
        errors: [{ message: `Not true` }],
      }
}

export const FalseLiteralParser = (data: unknown): ParseResult<false> => {
  return data === false
    ? { ok: true, result: data }
    : {
        ok: false,
        errors: [{ message: `Not false` }],
      }
}

export const NullLiteralParser = (data: unknown): ParseResult<null> => {
  return data === null
    ? { ok: true, result: data }
    : {
        ok: false,
        errors: [{ message: `Not null` }],
      }
}

export const UndefinedLiteralParser = (
  data: unknown,
): ParseResult<undefined> => {
  return data === undefined
    ? { ok: true, result: data }
    : {
        ok: false,
        errors: [{ message: `Not undefined` }],
      }
}

export const DateParser = (data: unknown): ParseResult<Date> => {
  return data instanceof Date ||
    (typeof data === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(data))
    ? { ok: true, result: new Date(data) }
    : {
        ok: false,
        errors: [{ message: `Not a Date` }],
      }
}

export const ObjectLiteralParser =
  <T>(shape: [string, Parser<any>][]) =>
  (data: unknown): ParseResult<T> => {
    const result: any = {}
    const errors: ParseError[] = []

    if (typeof data === "object" && data !== null) {
      for (const [prop, propParser] of shape) {
        const propParseResult = propParser((data as any)[prop])
        if (errors.length === 0 && propParseResult.ok) {
          result[prop] = propParseResult.result
        } else if (!propParseResult.ok) {
          errors.push({
            path: prop,
            message: "Property incorrect",
            errors: propParseResult.errors,
          })
        }
      }
    } else {
      errors.push({
        message: "Not an object",
      })
    }

    return errors.length === 0 ? { ok: true, result } : { ok: false, errors }
  }

// export const PersonParser = (data: unknown): ParseResult<Person> => {
//   const result: any = {}
//   const errors: ParseError[] = []

//   if (typeof data === "object" && data !== null) {
//     const shape: [string, Parser<any>][] = [
//       ["name", StringParser],
//       ["age", NumberParser],
//       ["kids", ArrayParser(StringParser)]
//     ]
//     for (const [prop, propParser] of shape) {
//       const propParseResult = propParser((data as any)[prop])
//       if (errors.length === 0 && propParseResult.ok) {
//         result[prop] = propParseResult.result
//       } else if (!propParseResult.ok) {
//         errors.push({
//           path: prop,
//           message: "Property incorrect",
//           errors: propParseResult.errors,
//         })
//       }
//     }
//   } else {
//     errors.push({
//       message: "Not an object",
//     })
//   }

//   return errors.length === 0 ? { ok: true, result } : { ok: false, errors }
// }

export const PersonParser = ObjectLiteralParser<Person>([
  ["name", StringParser],
  ["age", NumberParser],
  ["kids", ArrayParser(StringParser)],
])

type TupleElementParsers<T extends any[]> = {
  [key in keyof T]: Parser<T[key]>
}

export const TupleParser =
  <T extends any[]>(elementParsers: TupleElementParsers<T>) =>
  (data: unknown): ParseResult<T> => {
    const result: any = []
    const errors: ParseError[] = []
    if (Array.isArray(data)) {
      if (data.length === elementParsers.length) {
        for (let i = 0; i < elementParsers.length; i++) {
          const elementParseResult = elementParsers[i](data[i])
          if (errors.length === 0 && elementParseResult.ok) {
            result.push(elementParseResult.result)
          } else if (!elementParseResult.ok) {
            errors.push({
              path: i.toString(),
              message: `Element incorrect`,
              errors: elementParseResult.errors,
            })
          }
        }
      } else {
        errors.push({
          message: `Tuple has incorrect length`,
        })
      }
    } else {
      errors.push({
        message: `Not a tuple`,
      })
    }
    return errors.length === 0 ? { ok: true, result } : { ok: false, errors }
  }

type Parser<T> = (data: unknown) => ParseResult<T>

type ParseResult<T> = ParseSucceed<T> | ParseFailure

interface ParseSucceed<T> {
  ok: true
  result: T
}
interface ParseFailure {
  ok: false
  errors: ParseError[]
}
interface ParseError {
  message: string
  path?: string
  errors?: ParseError[]
}

export const UnionParser =
  <T>(...elementParsers: Parser<T>[]) =>
  (data: unknown): ParseResult<T> => {
    const errors: ParseError[] = []

    for (let i = 0; i < elementParsers.length; i++) {
      const parseResult = elementParsers[i](data)
      if (parseResult.ok) {
        return parseResult
      } else {
        errors.push({
          path: i.toString(),
          message: "Incorrect union element",
          errors: parseResult.errors,
        })
      }
    }

    return { ok: false, errors }
  }

export const IntersectionParser =
  <T>(...typeParsers: Parser<any>[]) =>
  (data: unknown): ParseResult<T> => {
    const result: any = {}
    const errors: ParseError[] = []

    for (let i = 0; i < typeParsers.length; i++) {
      const parseResult = typeParsers[i](data)
      if (errors.length === 0 && parseResult.ok) {
        Object.assign(result, parseResult.result)
      } else if (!parseResult.ok) {
        errors.push({
          path: i.toString(),
          message: "Incorrect intersection element",
          errors: parseResult.errors,
        })
      }
    }

    return errors.length === 0 ? { ok: true, result } : { ok: false, errors }
  }

export const IdentityParser = <T extends any | unknown>(
  data: unknown,
): ParseResult<T> => ({
  ok: true,
  result: data as T,
})

export const EnumParser =
  <T>(values: (number | string)[]) =>
  (data: unknown): ParseResult<T> => {
    return (typeof data === "string" || typeof data === "number") &&
      values.includes(data)
      ? {
          ok: true,
          result: data as T,
        }
      : {
          ok: false,
          errors: [{ message: `Not one of (${values.join(" | ")})` }],
        }
  }

ArrayParser(NumberParser)([1, 2, 3])
ArrayParser(NumberParser)([1, 2, "aad", 3])
NumberLiteralParser([1, 2, 3])(2)
NumberLiteralParser([1, 2, 3])(1123)
StringLiteralParser(["aap", "noot"])("noot")
StringLiteralParser(["aap", "noot"])("kees")
TupleParser<[string, number]>([StringParser, NumberParser])(["a", "b"])
TupleParser<[string, number]>([StringParser, NumberParser])(["a", 2])
PersonParser({ age: 1, name: "k", aad: 2, kids: ["m", "s"] })

UnionParser<string | number>(StringParser, NumberParser)(1)
UnionParser<string | number>(StringParser, NumberParser)("aap")
UnionParser<string | number>(StringParser, NumberParser)(true)
UnionParser<undefined | string>(UndefinedLiteralParser, StringParser)(undefined)

IdentityParser<any>(1)
IdentityParser<unknown>(1)

enum MyEnum {
  One = 1,
  Two = "x",
}

EnumParser<MyEnum>([MyEnum.One, MyEnum.Two])(1)
EnumParser<MyEnum>([MyEnum.One, MyEnum.Two])("x")
EnumParser<MyEnum>([MyEnum.One, MyEnum.Two])(2)
EnumParser<MyEnum>([MyEnum.One, MyEnum.Two])("One")

IntersectionParser<Person & { aap: string }>(
  PersonParser,
  ObjectLiteralParser<{ aap: string }>([["aap", StringParser]]),
)({
  age: 1,
  name: "k",
  aad: 2,
  kids: ["m", "s"],
  aap: "aap",
})

// TODO GENERICS
// TypeParameterParser

// Mapped Types
// https://www.typescriptlang.org/docs/handbook/2/mapped-types.html

// IndexMemberParser
// https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures
