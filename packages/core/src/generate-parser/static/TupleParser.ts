import { ParseError, Parser, ParseResult } from "../Parser"

interface TupleElementParser<T> {
  parser: Parser<T>
  isRestElement: boolean // TODO handle!
}
export function TupleParser<T extends any[]>(
  ...elementParsers: TupleElementParser<T>[]
): Parser<T> {
  return (data: unknown): ParseResult<T> => {
    const result: any = []
    const errors: ParseError[] = []
    if (Array.isArray(data)) {
      if (data.length === elementParsers.length) {
        for (let i = 0; i < elementParsers.length; i++) {
          const elementParseResult = elementParsers[i].parser(data[i])
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
}
