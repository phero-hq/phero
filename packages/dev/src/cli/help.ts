import chalk from "chalk"

export const samenHelp = chalk`
{dim Usage}
  {yellow {dim $} {bold samen} [command] [options]}

{dim Description}
  When no command is given, the development-environment will start.
  This is the primary way to run Samen. It will inspect the current
  directory and do the most appropriate thing possible:

    - When in a directory where {bold @samen/server} is installed, it will
      run the equivalent of {yellow {dim $} samen client serve}.

    - When in a directory where {bold @samen/client} is installed, it will
      run the equivalent of {yellow {dim $} samen client watch}.

    - When in a directory with multiple samen-projects, it will run
      the appropriate one of the above for each project.

    - When there's no samen-project found in the current directory, or
      in one of the direct child directories in it, it will prompt to
      initiate one for you (not implemented yet).

  When you're in need of any custom options, you cannot use this shortcut.
  Use {bold $ samen server} or {bold $ samen server} instead.

{dim Available commands}
  init, server, client

{dim Options}
  -h, --help        Output usage information
  -v, --version     Output the version number
  --verbose         Output debug information
`

export const samenHelpInit = chalk`
{dim Usage}
  {yellow {dim $} samen {bold init}}
  {yellow {dim $} samen {bold init client}}
  {yellow {dim $} samen {bold init server}}

{dim Description}
  Initialises a samen server or client project. Assumes npm and TypeScript
  to be installed and ready:

    {yellow {dim $} npm init}
    {yellow {dim $} npm i typescript --save-dev}
    {yellow {dim $} npx tsc --init}
    {yellow {dim $} npx samen init}
`

export const serverHelp = chalk`
{dim Usage}
  {yellow {dim $} samen {bold server} [command] [options]}

{dim Available commands}
  serve, build

{dim Options}
  -h, --help        Output usage information
  -v, --version     Output the version number
`

export const serverHelpServe = chalk`
{dim Usage}
  {yellow {dim $} samen server {bold serve} [options]}

{dim Description}
  Watches changes in the samen-file and runs {yellow build} when it does.
  Also emits events for client-watch-processes and serves RPC's.

{dim Options}
  -h, --help          Output usage information
  --verbose           Output debug information
  -p, --port    3030  Custom port for the server to be running on
`

export const serverHelpBuild = chalk`
{dim Usage}
  {yellow {dim $} samen server {bold build} [options]}

{dim Description}
  Takes a samen-file, parses it and generates a manifest and the
  RPC's for it. Assumes a samen-file at {yellow src/samen.ts}.

{dim Options}
  -h, --help        Output usage information
  --verbose         Output debug information
`

export const clientHelp = chalk`
{dim Usage}
  {yellow {dim $} {bold samen client} [command] [options]}

{dim Available commands}
  watch, build

{dim Options}
  -h, --help        Output usage information
  -v, --version     Output the version number
`

export const clientHelpWatch = chalk`
{dim Usage}
  {yellow {dim $} samen client {bold watch} [server-url] [options]}

{dim Description}
  Connects to a dev-server and runs {yellow build} as soon as the
  manifest changes. The server can be located by its URL:

    {yellow {dim $} samen client build {bold http://localhost:8000}}

  The default location of a server is http://localhost:3030.

{dim Options}
  -h, --help            Output usage information
  --verbose             Output debug information
  -p, --port    4040    Specify a custom port for the client-watch-server
                        to be running on. When you've got multiple clients
                        watching a server at the same time, give each its
                        own port.
`

export const clientHelpBuild = chalk`
{dim Usage}
  {yellow {dim $} samen client {bold build} [server-location] [options]}

{dim Description}
  Takes the manifest from a server and generates a client for
  it. The server can be located by:

  - File location     {yellow {dim $} samen client build {bold ../api}}
  - URL               {yellow {dim $} samen client build {bold http://localhost:8000}}

  The default location of a server is http://localhost:3030.

{dim Options}
  -h, --help        Output usage information
  --verbose         Output debug information
`
