import { ParseError, Parser, ParseResult } from "../Parser"

export default function UnionParser<T>(
  ...elementParsers: Parser<T>[]
): Parser<T> {
  return (data: unknown): ParseResult<T> => {
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
}
