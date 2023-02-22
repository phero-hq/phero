import { DataParseError, Parser, ParseResult } from "../../domain/Parser"

export default function UnionParser<T>(
  ...elementParsers: Parser<any>[]
): Parser<T> {
  return (data: unknown): ParseResult<T> => {
    const errors: DataParseError[] = []

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
