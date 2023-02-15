import ts from "typescript"
import { ParseError } from "../../domain/errors"

export default function propertyNameAsString(
  propertyName: ts.PropertyName,
): string {
  if (ts.isIdentifier(propertyName)) {
    return propertyName.text
  }
  if (ts.isStringLiteral(propertyName)) {
    return propertyName.text
  }
  if (ts.isNumericLiteral(propertyName)) {
    return propertyName.text
  }
  if (ts.isComputedPropertyName(propertyName)) {
    throw new ParseError(
      "Member name must not be computed property",
      propertyName,
    )
  }

  if (ts.isPrivateIdentifier(propertyName)) {
    throw new ParseError(
      "Member name must not be private identifier",
      propertyName,
    )
  }

  throw new ParseError(`Unexpected value for member name`, propertyName)
}
