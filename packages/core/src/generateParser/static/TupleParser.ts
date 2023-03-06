import {
  type DataParseError,
  type Parser,
  type ParseResult,
} from "../../domain/Parser"

type TupleElementParser = [parser: Parser<any>, isRestElement?: boolean]

export default function TupleParser<T extends unknown[]>(
  ...elementParsers: TupleElementParser[]
): Parser<T> {
  return (data: unknown): ParseResult<T> => {
    const result: any = []
    const errors: DataParseError[] = []

    const processResult = (
      index: number,
      elementParseResult: ParseResult<any>,
    ): void => {
      if (elementParseResult.ok) {
        if (errors.length === 0) {
          result[index] = elementParseResult.result
        }
      } else {
        errors.push({
          path: index.toString(),
          message: `Element incorrect`,
          errors: elementParseResult.errors,
        })
      }
    }

    if (Array.isArray(data)) {
      for (let i = 0; i < elementParsers.length; i++) {
        const [elementParser, isRestElement] = elementParsers[i]
        if (!isRestElement) {
          processResult(i, elementParser(data[i]))
        } else {
          for (let j = 0; j < elementParsers.length; j++) {
            const [elementParser, isRestElement] =
              elementParsers[elementParsers.length - 1 - j]
            const elementIndex = data.length - 1 - j
            if (!isRestElement) {
              processResult(elementIndex, elementParser(data[elementIndex]))
            } else {
              // rest element parser
              for (let r = i; r <= elementIndex; r++) {
                processResult(r, elementParser(data[r]))
              }
              break
            }
          }
          break
        }
      }
    } else {
      errors.push({
        message: `Not a tuple`,
      })
    }
    return errors.length === 0 ? { ok: true, result } : { ok: false, errors }
  }
}
