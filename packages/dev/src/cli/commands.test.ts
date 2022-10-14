import {
  parseClientCommand,
  parsePheroCommand,
  parseServerCommand,
} from "./commands"

describe("parseServerCommand", () => {
  function run(cmd: string) {
    return parseServerCommand(cmd.split(" ").splice(1))
  }

  function err(cmd: string) {
    return () => run(cmd)
  }

  describe("common", () => {
    test("cmd:   'phero-server --version'", () => {
      expect(run("phero-server --version")).toMatchSnapshot()
    })

    test("cmd:   'phero-server -v'", () => {
      expect(run("phero-server -v")).toMatchSnapshot()
    })

    test("cmd:   'phero-server --help'", () => {
      expect(run("phero-server --help")).toMatchSnapshot()
    })

    test("cmd:   'phero-server -h'", () => {
      expect(run("phero-server -h")).toMatchSnapshot()
    })

    test("cmd:   'phero-server nothing'", () => {
      expect(err("phero-server nothing")).toThrow()
    })
  })

  describe("serve", () => {
    test("cmd:   'phero-server serve --help'", () => {
      expect(run("phero-server serve --help")).toMatchSnapshot()
    })

    test("cmd:   'phero-server serve -h'", () => {
      expect(run("phero-server serve -h")).toMatchSnapshot()
    })

    test("cmd:   'phero-server serve'", () => {
      expect(run("phero-server serve")).toMatchSnapshot()
    })

    test("cmd:   'phero-server serve --verbose'", () => {
      expect(run("phero-server serve --verbose")).toMatchSnapshot()
    })

    test("cmd:   'phero-server serve --port 1234'", () => {
      expect(run("phero-server serve --port 1234")).toMatchSnapshot()
    })

    test("cmd:   'phero-server serve -p 1234'", () => {
      expect(run("phero-server serve -p 1234")).toMatchSnapshot()
    })

    test("cmd:   'phero-server serve -p 1234 --verbose'", () => {
      expect(run("phero-server serve -p 1234 --verbose")).toMatchSnapshot()
    })
  })

  describe("build", () => {
    test("cmd:   'phero-server build --help'", () => {
      expect(run("phero-server build --help")).toMatchSnapshot()
    })

    test("cmd:   'phero-server build -h'", () => {
      expect(run("phero-server build -h")).toMatchSnapshot()
    })

    test("cmd:   'phero-server build'", () => {
      expect(run("phero-server build")).toMatchSnapshot()
    })

    test("cmd:   'phero-server build --verbose'", () => {
      expect(run("phero-server build --verbose")).toMatchSnapshot()
    })
  })

  describe("export", () => {
    test("cmd:   'phero-server export --help'", () => {
      expect(run("phero-server export --help")).toMatchSnapshot()
    })

    test("cmd:   'phero-server export -h'", () => {
      expect(run("phero-server export -h")).toMatchSnapshot()
    })

    test("cmd:   'phero-server export'", () => {
      expect(run("phero-server export")).toMatchSnapshot()
    })

    test("cmd:   'phero-server export --verbose'", () => {
      expect(run("phero-server export --verbose")).toMatchSnapshot()
    })
  })
})

describe("parseClientCommand", () => {
  function run(cmd: string) {
    return parseClientCommand(cmd.split(" ").splice(1))
  }

  function err(cmd: string) {
    return () => run(cmd)
  }

  describe("common", () => {
    test("cmd:   'phero-client --version'", () => {
      expect(run("phero-client --version")).toMatchSnapshot()
    })

    test("cmd:   'phero-client -v'", () => {
      expect(run("phero-client -v")).toMatchSnapshot()
    })

    test("cmd:   'phero-client --help'", () => {
      expect(run("phero-client --help")).toMatchSnapshot()
    })

    test("cmd:   'phero-client -h'", () => {
      expect(run("phero-client -h")).toMatchSnapshot()
    })

    test("cmd:   'phero-client nothing'", () => {
      expect(err("phero-client nothing")).toThrow()
    })
  })

  describe("watch", () => {
    test("cmd:   'phero-client watch --help'", () => {
      expect(run("phero-client watch --help")).toMatchSnapshot()
    })

    test("cmd:   'phero-client watch -h'", () => {
      expect(run("phero-client watch -h")).toMatchSnapshot()
    })

    test("cmd:   'phero-client watch'", () => {
      expect(run("phero-client watch")).toMatchSnapshot()
    })

    test("cmd:   'phero-client watch http://localhost:1234'", () => {
      expect(run("phero-client watch http://localhost:1234")).toMatchSnapshot()
    })

    test("cmd:   'phero-client watch --verbose'", () => {
      expect(run("phero-client watch --verbose")).toMatchSnapshot()
    })

    test("cmd:   'phero-client watch --port 1234'", () => {
      expect(run("phero-client watch --port 1234")).toMatchSnapshot()
    })

    test("cmd:   'phero-client watch -p 1234'", () => {
      expect(run("phero-client watch -p 1234")).toMatchSnapshot()
    })

    test("cmd:   'phero-client watch http://localhost:1234 --verbose --port 4321'", () => {
      expect(
        run("phero-client watch http://localhost:1234 --verbose --port 4321"),
      ).toMatchSnapshot()
    })

    test("cmd:   'phero-client watch ../api'", () => {
      expect(err("phero-client watch ../api")).toThrow()
    })
  })

  describe("build", () => {
    test("cmd:   'phero-client build --help'", () => {
      expect(run("phero-client build --help")).toMatchSnapshot()
    })

    test("cmd:   'phero-client build -h'", () => {
      expect(run("phero-client build -h")).toMatchSnapshot()
    })

    test("cmd:   'phero-client build'", () => {
      expect(run("phero-client build")).toMatchSnapshot()
    })

    test("cmd:   'phero-client build http://localhost:1234'", () => {
      expect(run("phero-client build http://localhost:1234")).toMatchSnapshot()
    })

    test("cmd:   'phero-client build --verbose'", () => {
      expect(run("phero-client build --verbose")).toMatchSnapshot()
    })

    test("cmd:   'phero-client build http://localhost:1234 --verbose'", () => {
      expect(
        run("phero-client build http://localhost:1234 --verbose"),
      ).toMatchSnapshot()
    })
  })
})

describe("parsePheroCommand", () => {
  function run(cmd: string) {
    return parsePheroCommand(cmd.split(" ").splice(1))
  }

  function err(cmd: string) {
    return () => run(cmd)
  }

  describe("common", () => {
    test("cmd:   'phero --version'", () => {
      expect(run("phero --version")).toMatchSnapshot()
    })

    test("cmd:   'phero -v'", () => {
      expect(run("phero -v")).toMatchSnapshot()
    })

    test("cmd:   'phero --help'", () => {
      expect(run("phero --help")).toMatchSnapshot()
    })

    test("cmd:   'phero -h'", () => {
      expect(run("phero -h")).toMatchSnapshot()
    })

    test("cmd:   'phero nothing'", () => {
      expect(err("phero nothing")).toThrow()
    })
  })

  describe("dev-env", () => {
    test("cmd:   'phero'", () => {
      expect(run("phero")).toMatchSnapshot()
    })
  })

  describe("client", () => {
    test("cmd:   'phero client watch'", () => {
      expect(run("phero client watch")).toMatchSnapshot()
    })

    test("cmd:   'phero client watch --port 1234'", () => {
      expect(run("phero client watch --port 1234")).toMatchSnapshot()
    })
  })

  describe("server", () => {
    test("cmd:   'phero server serve'", () => {
      expect(run("phero server serve")).toMatchSnapshot()
    })

    test("cmd:   'phero server serve --port 1234'", () => {
      expect(run("phero server serve --port 1234")).toMatchSnapshot()
    })
  })
})
