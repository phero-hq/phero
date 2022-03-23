export const render = () => (
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
          left={<ts-property-access-expression chain="inputParserResult.ok" />}
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
)
