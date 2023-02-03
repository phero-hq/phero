import ts from "typescript"
import { ParseError } from "../../domain/errors"
import {
  MemberParserModel,
  ObjectParserModel,
  ParserModel,
  ParserModelType,
} from "../ParserModel"
import generateFromTypeNode from "./generateFromTypeNode"

export interface ParserModelMap {
  root: ParserModel
  deps: Record<string, ParserModel>
}

export interface InternalParserModelMap {
  root: ParserModel
  deps: DependencyMap
}

export type DependencyMap = Map<string, ParserModel>
export type TypeParamMap = Map<string, { name: string; model: ParserModel }>

export interface FunctionParserModel {
  returnType: ParserModel
  parameters: ObjectParserModel
  deps: DependencyMap
}

export function generateParserModel(
  func: ts.FunctionDeclaration,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): FunctionParserModel {
  const returnTypeModel = generateFromReturnType(func, typeChecker, deps)
  const paramsModel = generateFromParameters(
    func,
    typeChecker,
    returnTypeModel.deps,
  )

  return {
    returnType: returnTypeModel.root,
    parameters: paramsModel.root,
    deps: paramsModel.deps,
  }
}

function generateFromReturnType(
  func: ts.FunctionDeclaration,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): InternalParserModelMap {
  const funcType = func.type

  if (!funcType) {
    throw new ParseError("Function must have an explicit return type", func)
  }

  const funcTypeType = typeChecker.getTypeAtLocation(funcType)

  return generateFromTypeNode(
    funcType,
    funcTypeType,
    funcType,
    typeChecker,
    deps,
    new Map(),
  )
}

function generateFromParameters(
  func: ts.FunctionDeclaration,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): { root: ObjectParserModel; deps: DependencyMap } {
  const { params, deps: paramDeps } = func.parameters.reduce<{
    params: MemberParserModel[]
    deps: DependencyMap
  }>(
    ({ params, deps }, param) => {
      if (!param.type) {
        throw new ParseError("Parameter should have a type", param)
      }

      const paramModel = generateFromTypeNode(
        param.type,
        typeChecker.getTypeAtLocation(param.type),
        param.type,
        typeChecker,
        deps,
        new Map(),
      )

      return {
        params: [
          ...params,
          {
            type: ParserModelType.Member,
            name: bindingNameAsString(param.name),
            optional: !!param.questionToken,
            parser: paramModel.root,
          },
        ],
        deps: paramModel.deps,
      }
    },
    { params: [], deps },
  )

  return {
    root: {
      type: ParserModelType.Object,
      members: params,
    },
    deps: paramDeps,
  }
}

function bindingNameAsString(name: ts.BindingName): string {
  if (ts.isIdentifier(name)) {
    return name.text
  }

  throw new ParseError("Binding names are not supported", name)
}
