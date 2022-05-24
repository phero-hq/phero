# Commands

In most cases, you will control Samen by running `npx samen`, or some variant of it. If you need to digg down to the details (or you're just curious), take a look at the [internal commands](#Internal-commands) for more information.

## `npx samen`

The primary way to run Samen. It will inspect the current directory and do the most appropriate thing possible:

- When in a directory where `@samen/server` is installed, it will run the equivalent of `npx samen server serve`.
- When in a directory where `@samen/client` is installed, it will run the equivalent of `npx samen client watch`.
- When in a directory with multiple samen-projects, it will run the appropriate one of the above for each project.
- When there's no samen-project found in the current directory, or in one of the direct child directories in it, it will prompt to initiate one for you (not implemented yet).

When you're in need of any custom options, you cannot use this shortcut. Use one of the commands following commands instead.

### `npx samen server init` (not implemented yet)

This does a couple of things, to make your server-project ready to go:

- Installs the `@samen/server` package.
- Creates an example of a samen-file at `src/samen.ts`.

### `npx samen server build`

Takes a samen-file, parses it and generates a manifest and the RPC's for it. Assumes a samen-file at `src/samen.ts`.

### `npx samen server serve [options]`

Watches changes in the samen-file and runs `build` when it does. Also connects to client-watch processes and serves RPC's.

#### Options

- `-p, --port`: Specify a custom port for the server to be running on. Defaults to `3030`.

### `npx samen client init` (not implemented yet)

This does a couple of things, to add Samen to your client-project:

- Installs the `@samen/client` package.
- Creates an example of a client at `src/samen.ts`.

### `npx samen client build [server-location] [options]`

Takes the manifest from a server and generates a client for it. The server can be located by a couple of ways:

- By the file location of the server: `npx samen client build ../api`
- By the URL of the server: `npx samen client build http://localhost:8000`.
- By leaving out the location of the server, assuming a server is running at `http://localhost:3030`.

> Make sure you're not targeting the manifest-file itself, but the server instead. This way the location of the manifest-file could be modified by the server, without affecting configuration in the client.

### `npx samen client watch [server-location] [options]`

Connects to a dev-server and runs `build` as soon as the manifest changes. The location of the server works similar to `npx samen client build`, with the exception that pointing to a server by file location is not supported. In other words, you can watch a server in these ways:

- By the URL of the server: `npx samen client watch http://localhost:8000`.
- By leaving out the location of the server, assuming a server is running at `http://localhost:3030`.

#### Options

- `-p, --port`: Specify a custom port for the client-watch-server to be running on. When you've got multiple clients watching a server at the same time, give each client its own port. Defaults to `4040`.

## Internal commands

`npx samen` is a UI layer that redirects the commands to the `samen-server` or `samen-client` executables, provided by the `@samen/server` and `@samen/client` packages. It shouldn't be required to know this, but you can use these executables by their own as well:

### `samen-server`

```
samen-server --version

  Version of @samen/server

samen-server --help

  Displays this message

samen-server init

  Installs the `@samen/server` package in the current directory and creates an example of a samen-file at `src/samen.ts`.

samen-server build

  Takes a samen-file, parses it and generates a manifest and the RPC's for it. Assumes a samen-file at `src/samen.ts`.

samen-server serve [options]

  Watches changes in the samen-file and runs `build` when it does. Also emits events for client-watch-processes and serves RPC's.

  OPTIONS

    -p, --port    3030     Specify a custom port for the server to be running on.

    --quiet       false    Don't emit any output, used by `npx samen` which listens to the emitted events instead.

    --debug       false    Output more information to debug a problem
```

### `samen-client`

```
samen-client --version

  Version of @samen/client

samen-client --help

  Displays this message

samen-client init

  Installs the `@samen/client` package in the current directory and creates an example of a client at `src/samen.ts`.

samen-client build [server-location] [options]

  Takes the manifest from a server and generates a client for it. The server can be located by:

    - File location     samen-client build ../api
    - URL               samen-client build http://localhost:8000

  The default location of a server is http://localhost:3030.

samen-client watch [server-location] [options]

  Connects to a dev-server and runs `build` as soon as the manifest changes. The server can be located by:

    - URL               samen-client build http://localhost:8000

  The default location of a server is http://localhost:3030.

  OPTIONS

    -p, --port    4040     Specify a custom port for the client-watch-server to be running on.
                           When you've got multiple clients watching a server at the same time,
                           give each client its own port.

    --quiet       false    Don't emit any output, used by `npx samen` which listens to the emitted
                           events instead.

    --debug       false    Output more information to debug a problem
```
