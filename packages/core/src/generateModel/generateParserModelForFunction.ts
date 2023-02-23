import ts from "typescript"
import { DependencyMap, InternalParserModelMap } from "."
import { PheroParseError } from "../domain/errors"
import {
  ParserModel,
  ObjectParserModel,
  MemberParserModel,
  ParserModelType,
} from "../domain/ParserModel"
import { getNameAsString } from "../lib/tsUtils"
import parseReturnType from "../parsePheroApp/parseReturnType"
import generateFromTypeNode from "./generateFromTypeNode"

export interface FunctionParserModel {
  returnType: ParserModel
  parameters: ObjectParserModel
  deps: DependencyMap
}

type FunctionType =
  | ts.FunctionDeclaration
  | ts.FunctionExpression
  | ts.ArrowFunction
  | ts.MethodSignature

export default function generateParserModelForFunction(
  func: FunctionType,
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
  func: FunctionType,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): InternalParserModelMap {
  const funcType = parseReturnType(func)

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
  func: FunctionType,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): { root: ObjectParserModel; deps: DependencyMap } {
  const { params, deps: paramDeps } = func.parameters.reduce<{
    params: MemberParserModel[]
    deps: DependencyMap
  }>(
    ({ params, deps }, param) => {
      if (!param.type) {
        throw new PheroParseError("Parameter should have a type", param)
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
            name: getNameAsString(param.name),
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
