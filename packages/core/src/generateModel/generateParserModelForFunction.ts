import ts from "typescript"
import { type DependencyMap, type InternalParserModelMap } from "."
import { PheroParseError } from "../domain/errors"
import {
  type ParserModel,
  type ObjectParserModel,
  type MemberParserModel,
  ParserModelType,
} from "../domain/ParserModel"
import { getNameAsString } from "../lib/tsUtils"
import parseReturnType from "../parsePheroApp/parseReturnType"
import generateFromTypeNode from "./generateFromTypeNode"

export interface FunctionParserModel {
  returnType: ParserModel
  parameters: ObjectParserModel
  contextType?: ObjectParserModel
  deps: DependencyMap
}

type FunctionType =
  | ts.MethodDeclaration
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

  const contextTypeModel = generateContexTypeModel(func, typeChecker, deps)

  return {
    returnType: returnTypeModel.root,
    parameters: paramsModel.root,
    contextType: contextTypeModel.root,
    deps: contextTypeModel.deps,
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
    ({ params, deps }, param, paramIndex) => {
      if (!param.type) {
        throw new PheroParseError("Parameter should have a type", param)
      }

      if (getContextParamType(param.type)) {
        if (paramIndex !== 0) {
          throw new PheroParseError(
            `Context parameter should be the first parameter of your function`,
            param,
          )
        }
        return { params, deps }
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

function getContextParamType(paramType: ts.TypeNode): ts.TypeNode | undefined {
  if (
    !ts.isTypeReferenceNode(paramType) ||
    getNameAsString(paramType.typeName) !== "PheroContext"
  ) {
    return undefined
  }
  return paramType.typeArguments?.[0]
}

function generateContexTypeModel(
  func: FunctionType,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): { root: ObjectParserModel | undefined; deps: DependencyMap } {
  const firstParamType = func.parameters[0]?.type
  if (!firstParamType) {
    return { root: undefined, deps }
  }

  const contextType = getContextParamType(firstParamType)

  if (!contextType) {
    return { root: undefined, deps }
  }

  const contextTypeModel = generateFromTypeNode(
    contextType,
    typeChecker.getTypeAtLocation(contextType),
    firstParamType,
    typeChecker,
    deps,
    new Map(),
  )

  const findContextMembers = (m: ParserModel): MemberParserModel[] => {
    switch (m.type) {
      case ParserModelType.Object:
        return m.members.filter(
          (m): m is MemberParserModel => m.type === ParserModelType.Member,
        )
      case ParserModelType.Intersection:
        return m.parsers.flatMap(findContextMembers)
      case ParserModelType.Generic:
        return findContextMembers(m.parser)
      case ParserModelType.Reference: {
        const dep = deps.get(m.typeName)
        if (!dep) {
          throw new PheroParseError(
            `Can't find dependency type with name ${m.typeName}`,
            func,
          )
        }
        return findContextMembers(dep)
      }
      default:
        throw new PheroParseError("Context parameter has wrong type", func)
    }
  }

  const members = findContextMembers(contextTypeModel.root)

  return {
    root: {
      type: ParserModelType.Object,
      members,
    },
    deps: contextTypeModel.deps,
  }
}
