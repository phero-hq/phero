import ts from "typescript"
import getClassDeclaration from "./getClassDeclaration"

export default function getSuperClassesForError(
  classDeclaration: ts.ClassDeclaration,
  accum: ts.ClassDeclaration[],
  prog: ts.TypeChecker,
): ts.ClassDeclaration[] | undefined {
  const extendsType = classDeclaration.heritageClauses?.find(
    (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
  )?.types[0]

  if (!extendsType) {
    // class has no Error super type
    // TODO Maybe emit a warning here?
    return
  }

  const typeNode = prog.getTypeFromTypeNode(extendsType)
  const refSymbol = typeNode.aliasSymbol ?? typeNode.symbol

  if (refSymbol.name === "Error") {
    return accum
  }

  const superClass = getClassDeclaration(extendsType, prog)

  if (superClass === undefined) {
    return undefined
  }

  return getSuperClassesForError(superClass, [...accum, superClass], prog)
}
