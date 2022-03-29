import { TSAnyElement } from "./ts-elements/ts-any"
import { TSTypeElement } from "./ts-elements/ts-type"

const RootRender = () => (
  <ts-source-file>
    <ts-function
      export
      async
      name="aad"
      params={[<ts-parameter name="input" type={<ts-any />} />]}
      returnType={
        <ts-type-reference
          name="Promise"
          args={[<ts-type-reference name="RPCResult" args={[<ts-any />]} />]}
        />
      }
    >
      <ts-const
        name="inputParser"
        init={
          <ts-arrow-function
            params={[<ts-parameter name="data" type={<ts-any />} />]}
            returnType={
              <ts-type-reference name="ParseResult" args={[<ts-any />]} />
            }
            body={
              <ts-block>
                <ts-const name="aad" />
              </ts-block>
            }
          />
        }
      />
      <ts-const
        name="inputParseResult"
        init={
          <ts-await>
            <ts-call-expression name="inputParser" args={["input"]} />
          </ts-await>
        }
      />
      <ts-const
        name="outputParser"
        init={
          <ts-arrow-function
            params={[
              <ts-parameter name="data" type={<ts-any />} />,
              <ts-parameter
                name="xxx"
                type={<ts-array elementType={<ts-string />} />}
              />,
            ]}
            returnType={
              <ts-type-reference name="ParseResult" args={[<ts-any />]} />
            }
            body={
              <ts-block>
                <ts-const name="aad" />
              </ts-block>
            }
          />
        }
      />
      <ts-if
        expression={
          <ts-binary-expression
            left={
              <ts-property-access-expression chain="inputParserResult.ok" />
            }
            op="=="
            right={<ts-false />}
          />
        }
        then={
          <ts-block>
            <ts-const name="a" init={<ts-number-literal value={10} />} />
            <ts-const name="a" init={<ts-string-literal value="xxx" />} />
            <ts-const name="a" init={<ts-false />} />
            <ts-const name="a" init={<ts-true />} />
            <ts-const name="a" init={<ts-null />} />
            <ts-const name="a" init={<ts-undefined />} />
            <ts-const
              name="a"
              init={
                <ts-object-literal>
                  <ts-property-assignment name="kees" init={<ts-true />} />
                  <ts-shorthand-property-assignment name="kaas" />
                </ts-object-literal>
              }
            />

            <ts-try>
              <ts-block>
                <ts-const name="a" init={<ts-undefined />} />
              </ts-block>
              <ts-catch errorName="error">
                <ts-block>
                  <ts-const name="b" init={<ts-undefined />} />
                </ts-block>
              </ts-catch>
              <ts-finally>
                <ts-block>
                  <ts-const name="c" />
                </ts-block>
              </ts-finally>
            </ts-try>

            <ts-return expression={<ts-false />} />
          </ts-block>
        }
      />
    </ts-function>

    <ts-type-alias
      export
      name="ParseResult"
      typeParameters={[<ts-type-parameter name="T" />]}
      type={
        <ts-union types={[<ts-string />, <ts-number-literal value={10} />]} />
      }
    />
    <ts-interface
      export
      name="RPCOkResult"
      typeParameters={[<ts-type-parameter name="T" />]}
    >
      <ts-property-signature
        name="status"
        optional
        type={<ts-number-literal value={200} />}
      />
      <ts-property-signature
        name="result"
        type={<ts-type-reference name="T" />}
      />
    </ts-interface>
    <ParseResult name="ParseResult2" />
    <ParseResult name="ParseResult3" isExport />
    <ParseResult name="ParseResult4" />
  </ts-source-file>
)

export const render = () => <RootRender />

function ParseResult({ name, isExport }: { name: string; isExport?: boolean }) {
  return (
    <ts-type-alias
      export={isExport}
      name={name}
      typeParameters={[<ts-type-parameter name="T" />]}
      type={
        <ts-type-literal>
          <ts-property-signature
            name="aad"
            type={<ts-type-reference name="T" />}
          />
        </ts-type-literal>
      }
    />
  )
}
