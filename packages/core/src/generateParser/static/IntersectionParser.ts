import {
  type DataParseError,
  type Parser,
  type ParseResult,
} from "../../domain/Parser"

export default function IntersectionParser<T>(
  ...typeParsers: Parser<any>[]
): Parser<T> {
  return (data: unknown): ParseResult<T> => {
    const result: any = {}
    const errors: DataParseError[] = []

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
}
