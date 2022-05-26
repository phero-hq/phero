import {
  parseClientCommand,
  parseSamenCommand,
  parseServerCommand,
} from "./commands"

describe("parseServerCommand", () => {
  function run(cmd: string) {
    return parseServerCommand(cmd.split(" "))
  }

  function err(cmd: string) {
    return () => run(cmd)
  }

  describe("common", () => {
    test("cmd:   'samen-server --version'", () => {
      expect(run("samen-server --version")).toMatchSnapshot()
    })

    test("cmd:   'samen-server -v'", () => {
      expect(run("samen-server -v")).toMatchSnapshot()
    })

    test("cmd:   'samen-server --help'", () => {
      expect(run("samen-server --help")).toMatchSnapshot()
    })

    test("cmd:   'samen-server -h'", () => {
      expect(run("samen-server -h")).toMatchSnapshot()
    })

    test("cmd:   'samen-server nothing'", () => {
      expect(err("samen-server nothing")).toThrow()
    })
  })

  describe("serve", () => {
    test("cmd:   'samen-server serve --help'", () => {
      expect(run("samen-server serve --help")).toMatchSnapshot()
    })

    test("cmd:   'samen-server serve -h'", () => {
      expect(run("samen-server serve -h")).toMatchSnapshot()
    })

    test("cmd:   'samen-server serve'", () => {
      expect(run("samen-server serve")).toMatchSnapshot()
    })

    test("cmd:   'samen-server serve --verbose'", () => {
      expect(run("samen-server serve --verbose")).toMatchSnapshot()
    })

    test("cmd:   'samen-server serve --port 1234'", () => {
      expect(run("samen-server serve --port 1234")).toMatchSnapshot()
    })

    test("cmd:   'samen-server serve -p 1234'", () => {
      expect(run("samen-server serve -p 1234")).toMatchSnapshot()
    })

    test("cmd:   'samen-server serve -p 1234 --verbose'", () => {
      expect(run("samen-server serve -p 1234 --verbose")).toMatchSnapshot()
    })
  })

  describe("build", () => {
    test("cmd:   'samen-server build --help'", () => {
      expect(run("samen-server build --help")).toMatchSnapshot()
    })

    test("cmd:   'samen-server build -h'", () => {
      expect(run("samen-server build -h")).toMatchSnapshot()
    })

    test("cmd:   'samen-server build'", () => {
      expect(run("samen-server build")).toMatchSnapshot()
    })

    test("cmd:   'samen-server build --verbose'", () => {
      expect(run("samen-server build --verbose")).toMatchSnapshot()
    })
  })
})

describe("parseClientCommand", () => {
  function run(cmd: string) {
    return parseClientCommand(cmd.split(" "))
  }

  function err(cmd: string) {
    return () => run(cmd)
  }

  describe("common", () => {
    test("cmd:   'samen-client --version'", () => {
      expect(run("samen-client --version")).toMatchSnapshot()
    })

    test("cmd:   'samen-client -v'", () => {
      expect(run("samen-client -v")).toMatchSnapshot()
    })

    test("cmd:   'samen-client --help'", () => {
      expect(run("samen-client --help")).toMatchSnapshot()
    })

    test("cmd:   'samen-client -h'", () => {
      expect(run("samen-client -h")).toMatchSnapshot()
    })

    test("cmd:   'samen-client nothing'", () => {
      expect(err("samen-client nothing")).toThrow()
    })
  })

  describe("watch", () => {
    test("cmd:   'samen-client watch --help'", () => {
      expect(run("samen-client watch --help")).toMatchSnapshot()
    })

    test("cmd:   'samen-client watch -h'", () => {
      expect(run("samen-client watch -h")).toMatchSnapshot()
    })

    test("cmd:   'samen-client watch'", () => {
      expect(run("samen-client watch")).toMatchSnapshot()
    })

    test("cmd:   'samen-client watch http://localhost:1234'", () => {
      expect(run("samen-client watch http://localhost:1234")).toMatchSnapshot()
    })

    test("cmd:   'samen-client watch --verbose'", () => {
      expect(run("samen-client watch --verbose")).toMatchSnapshot()
    })

    test("cmd:   'samen-client watch --port 1234'", () => {
      expect(run("samen-client watch --port 1234")).toMatchSnapshot()
    })

    test("cmd:   'samen-client watch -p 1234'", () => {
      expect(run("samen-client watch -p 1234")).toMatchSnapshot()
    })

    test("cmd:   'samen-client watch http://localhost:1234 --verbose --port 4321'", () => {
      expect(
        run("samen-client watch http://localhost:1234 --verbose --port 4321"),
      ).toMatchSnapshot()
    })

    test("cmd:   'samen-client watch ../api'", () => {
      expect(err("samen-client watch ../api")).toThrow()
    })
  })

  describe("build", () => {
    test("cmd:   'samen-client build --help'", () => {
      expect(run("samen-client build --help")).toMatchSnapshot()
    })

    test("cmd:   'samen-client build -h'", () => {
      expect(run("samen-client build -h")).toMatchSnapshot()
    })

    test("cmd:   'samen-client build'", () => {
      expect(run("samen-client build")).toMatchSnapshot()
    })

    test("cmd:   'samen-client build http://localhost:1234'", () => {
      expect(run("samen-client build http://localhost:1234")).toMatchSnapshot()
    })

    test("cmd:   'samen-client build --verbose'", () => {
      expect(run("samen-client build --verbose")).toMatchSnapshot()
    })

    test("cmd:   'samen-client build http://localhost:1234 --verbose'", () => {
      expect(
        run("samen-client build http://localhost:1234 --verbose"),
      ).toMatchSnapshot()
    })
  })
})

describe("parseSamenCommand", () => {
  function run(cmd: string) {
    return parseSamenCommand(cmd.split(" "))
  }

  function err(cmd: string) {
    return () => run(cmd)
  }

  describe("common", () => {
    test("cmd:   'samen --version'", () => {
      expect(run("samen --version")).toMatchSnapshot()
    })

    test("cmd:   'samen -v'", () => {
      expect(run("samen -v")).toMatchSnapshot()
    })

    test("cmd:   'samen --help'", () => {
      expect(run("samen --help")).toMatchSnapshot()
    })

    test("cmd:   'samen -h'", () => {
      expect(run("samen -h")).toMatchSnapshot()
    })

    test("cmd:   'samen nothing'", () => {
      expect(err("samen nothing")).toThrow()
    })
  })

  describe("dev-env", () => {
    test("cmd:   'samen'", () => {
      expect(run("samen")).toMatchSnapshot()
    })
  })

  describe("client", () => {
    test("cmd:   'samen client watch'", () => {
      expect(run("samen client watch")).toMatchSnapshot()
    })

    test("cmd:   'samen client watch --port 1234'", () => {
      expect(run("samen client watch --port 1234")).toMatchSnapshot()
    })
  })

  describe("server", () => {
    test("cmd:   'samen server serve'", () => {
      expect(run("samen server serve")).toMatchSnapshot()
    })

    test("cmd:   'samen server serve --port 1234'", () => {
      expect(run("samen server serve --port 1234")).toMatchSnapshot()
    })
  })
})
