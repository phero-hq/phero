import { constDeclaration } from "./const"
import { functionDeclaration } from "./functionDeclaration"
import { importDeclaration } from "./importDeclaration"
import { interfaceDeclaration } from "./interface"
import { sourceFile } from "./sourceFile"
import { typeAlias } from "./typeAlias"
import { typeParam } from "./typeParam"
import { classDeclaration } from "./classDeclaration"

export class Declaration {
  public static const = constDeclaration
  public static function = functionDeclaration
  public static typeAlias = typeAlias
  public static interface = interfaceDeclaration
  public static sourceFile = sourceFile
  public static import = importDeclaration
  public static class = classDeclaration
  public static typeParam = typeParam
}
