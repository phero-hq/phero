import ts from "typescript"
import generateParserModel, {
  MemberParserModel,
  ObjectParserModel,
  ParserModelType,
} from "./code-gen/parsers/generateParserModel"
import { ParseError } from "./errors"
import {
  ParsedSamenFunctionDefinition,
  ParsedSamenServiceConfig,
} from "./parseSamenApp"
import { getNameAsString } from "./tsUtils"

export function parseContext(
  func: ParsedSamenFunctionDefinition,
  serviceConfig: ParsedSamenServiceConfig,
  typeChecker: ts.TypeChecker,
): ParsedSamenFunctionDefinition {
  const ctxIndex = func.parameters.findIndex(
    (p) =>
      p.type &&
      ts.isTypeReferenceNode(p.type) &&
      getNameAsString(p.type.typeName) === "SamenContext",
  )

  if (ctxIndex === -1) {
    return func
  }

  const ctxParam = func.parameters[ctxIndex]

  if (ctxIndex !== func.parameters.length - 1) {
    throw new ParseError(
      `SamenContext parameter should be the last parameter`,
      ctxParam,
    )
  }

  const ctxParamType = ctxParam.type

  if (!ctxParamType) {
    throw new ParseError(
      `SamenContext parameter should have a type declared`,
      ctxParam,
    )
  }

  if (
    !ts.isTypeReferenceNode(ctxParamType) ||
    ctxParamType.typeArguments?.length !== 1
  ) {
    throw new ParseError(
      `SamenContext parameter's type argument has an incorrect type`,
      ctxParam,
    )
  }

  const funcCtx = ctxParamType.typeArguments[0]

  const ctxIO = getContextIO(serviceConfig.middleware ?? [], typeChecker)

  const funcCtxParserModel = getRootObjectParserModel(funcCtx, typeChecker)
  const funcCtxProps = getPropertySignatures(funcCtx)

  for (const funcCtxMemberParser of funcCtxParserModel.members) {
    if (funcCtxMemberParser.type != ParserModelType.Member) {
      throw new ParseError(`Context type can't have index members`, funcCtx)
    }

    const prop = funcCtxProps.find(
      (p) => getNameAsString(p.name) === funcCtxMemberParser.name,
    )
    if (!prop) {
      throw new ParseError(
        `Can't find property with name ${funcCtxMemberParser.name}`,
        funcCtx,
      )
    }

    const accumulatedContextMember = ctxIO.accumulatedContext.members.find(
      (m): m is MemberParserModel =>
        m.type === ParserModelType.Member &&
        m.name === funcCtxMemberParser.name,
    )

    if (!accumulatedContextMember) {
      throw new ParseError(`Property should be provided by middleware`, prop)
    }

    if (!isSameMember(funcCtxMemberParser, accumulatedContextMember)) {
      throw new ParseError(
        `Context member ${funcCtxMemberParser.name} would change type of already existing context member`,
        prop,
      )
    }
  }

  const genCtx = ts.factory.createTypeReferenceNode(ctxParamType.typeName, [
    ts.factory.createTypeLiteralNode(ctxIO.inputContextProps),
  ])

  return {
    ...func,
    context: {
      type: genCtx,
      name: getNameAsString(ctxParam.name),
    },
  }
}

type ContextIO = {
  inputContext: ObjectParserModel
  inputContextProps: ts.PropertySignature[]
  accumulatedContext: ObjectParserModel
}

type MiddlewareContext = {
  nextType: ts.TypeNode | undefined
  contextType: ts.TypeNode | undefined
}

function getContextIO(
  middleware: Array<MiddlewareContext>,
  typeChecker: ts.TypeChecker,
): ContextIO {
  return middleware.reduce(
    (
      { inputContext, inputContextProps, accumulatedContext },
      { contextType: ctxType, nextType },
    ) => {
      if (ctxType) {
        const ctxParserModel = getRootObjectParserModel(ctxType, typeChecker)
        const ctxProps = getPropertySignatures(ctxType)
        for (const ctxMem of ctxParserModel.members) {
          if (ctxMem.type == ParserModelType.Member) {
            const accMemIndex = accumulatedContext.members.findIndex(
              (accMem) =>
                accMem.type == ParserModelType.Member &&
                accMem.name === ctxMem.name,
            )

            if (accMemIndex === -1) {
              // NOTE we need the context from the client
              inputContext.members.push(ctxMem)
              const ctxProp = ctxProps.find(
                (p) => getNameAsString(p.name) === ctxMem.name,
              )

              if (!ctxProp) {
                throw new ParseError(
                  `Can't find property with name ${ctxMem.name}`,
                  ctxType,
                )
              }

              inputContextProps.push(ctxProp)
              // we also accumlate it for use in other middleware or rpc
              accumulatedContext.members.push(ctxMem)
            } else {
              // lets check whether the user doesn't change already defined types of context
              const accMem = accumulatedContext.members[accMemIndex]
              if (accMem.type !== ParserModelType.Member) {
                throw new ParseError(
                  `Context type can't have index members`,
                  ctxType,
                )
              }
              if (!isSameMember(ctxMem, accMem)) {
                throw new ParseError(
                  `Context member ${ctxMem.name} would change type of already existing context member`,
                  ctxType,
                )
              }
            }
          }
        }
      }

      if (nextType) {
        const nextParserModel = getRootObjectParserModel(nextType, typeChecker)

        for (const nxtMem of nextParserModel.members) {
          if (nxtMem.type == ParserModelType.Member) {
            const accMemIndex = accumulatedContext.members.findIndex(
              (accMem) =>
                accMem.type == ParserModelType.Member &&
                accMem.name === nxtMem.name,
            )

            if (accMemIndex === -1) {
              accumulatedContext.members.push(nxtMem)
            } else {
              // NOTE overwrite with the new parser
              accumulatedContext.members[accMemIndex] = nxtMem
            }
          }
        }
      }

      return {
        inputContext,
        inputContextProps,
        accumulatedContext,
      }
    },
    {
      inputContext: {
        type: ParserModelType.Object,
        members: [],
      },
      inputContextProps: [],
      accumulatedContext: {
        type: ParserModelType.Object,
        members: [],
      },
    } as ContextIO,
  )
}

function getRootObjectParserModel(
  typeNode: ts.TypeNode,
  typeChecker: ts.TypeChecker,
): ObjectParserModel {
  const nextParserModel = generateParserModel(
    typeChecker,
    getDeclaredNode(typeNode, typeChecker),
    "root",
  )

  if (nextParserModel.parser.type !== ParserModelType.Object) {
    throw new ParseError("Should be an object type", typeNode)
  }

  return nextParserModel.parser
}

function getDeclaredNode(
  typeNode: ts.TypeNode,
  typeChecker: ts.TypeChecker,
): ts.Node {
  if (ts.isTypeReferenceNode(typeNode)) {
    const type = typeChecker.getTypeFromTypeNode(typeNode)
    const symbol = type.aliasSymbol ?? type.symbol
    if (symbol.declarations?.length) {
      return symbol.declarations[0]
    }
  }

  return typeNode
}

function getPropertySignatures(typeNode: ts.TypeNode): ts.PropertySignature[] {
  if (ts.isInterfaceDeclaration(typeNode)) {
    return typeNode.members.filter(ts.isPropertySignature)
  }
  if (ts.isTypeAliasDeclaration(typeNode)) {
    return getPropertySignatures(typeNode.type)
  }
  if (ts.isTypeLiteralNode(typeNode)) {
    return typeNode.members.filter(ts.isPropertySignature)
  }

  return []
}

function isSameMember(
  left: MemberParserModel,
  right: MemberParserModel,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}
