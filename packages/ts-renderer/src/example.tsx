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
      init={<ts-call-expression name="inputParser" args={["input"]} />}
    />
    <ts-const
      name="outputParser"
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
              </ts-object-literal>
            }
          />
          <ts-return expression={<ts-false />} />
        </ts-block>
      }
    />
  </ts-function>
)