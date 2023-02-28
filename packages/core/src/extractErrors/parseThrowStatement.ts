import ts from "typescript"
import getClassDeclaration from "../lib/getClassDeclaration"
import getSuperClassesForError from "../lib/getSuperClassesForError"

export default function parseThrowStatement(
  throwStatement: ts.ThrowStatement,
  prog: ts.Program,
): ts.ClassDeclaration | undefined {
  if (!ts.isNewExpression(throwStatement.expression)) {
    // TODO Maybe emit a warning here?
    return undefined
  }

  const typeChecker = prog.getTypeChecker()

  const classDeclaration = getClassDeclaration(
    throwStatement.expression,
    typeChecker,
  )

  if (classDeclaration === undefined) {
    // class has no Error super type
    return undefined
  }

  const superClasses = getSuperClassesForError(
    classDeclaration,
    [],
    typeChecker,
  )

  if (superClasses === undefined) {
    // class has no Error super type
    return undefined
  }

  if (!classDeclaration.name) {
    return undefined
  }

  return classDeclaration
}
