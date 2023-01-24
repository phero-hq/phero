import ts from "typescript"
import { ParseError } from "../../domain/errors"
import { ParserModel } from "../ParserModel"
import generateFromTypeNode from "./generateFromTypeNode"

export interface ParserModelMap {
  root: ParserModel
  deps: Record<string, ParserModel>
}

export interface InternalParserModelMap {
  root: ParserModel
  deps: DependencyMap
}

export type DependencyMap = Map<string, { name: string; model: ParserModel }>
export type TypeParamMap = Map<string, { name: string; model: ParserModel }>

export function generateParserModel(
  func: ts.FunctionDeclaration,
  prog: ts.Program,
): ParserModelMap {
  const typeChecker = prog.getTypeChecker()

  const funcType = func.type

  if (!funcType) {
    throw new ParseError("Function must have type", func)
  }

  const funcTypeType = typeChecker.getTypeAtLocation(
    funcType,
  ) as ts.TypeReference

  const { root, deps } = generateFromTypeNode(
    funcType,
    funcTypeType,
    funcType,
    typeChecker,
    new Map(),
    new Map(),
  )

  return {
    root,
    deps: [...deps.values()].reduce<Record<string, ParserModel>>(
      (result, dep) => ({ ...result, [dep.name]: dep.model }),
      {},
    ),
  }
}
