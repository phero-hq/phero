import { Parser, ParseResult, ParseError } from "../Parser"

export default function ArrayParser<T>(elementParser: Parser<T>): Parser<T[]> {
  return (data: unknown): ParseResult<T[]> => {
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
}
