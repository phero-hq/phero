import chalk from "chalk"

export const pheroHelp = chalk`
{dim Usage}
  {yellow {dim $} {bold phero} [command] [options]}

{dim Description}
  When no command is given, the development-environment will start.
  This is the primary way to run Phero. It will inspect the current
  directory and do the most appropriate thing possible:

    - When in a directory where {bold @phero/server} is installed, it will
      run the equivalent of {yellow {dim $} phero client serve}.

    - When in a directory where {bold @phero/client} is installed, it will
      run the equivalent of {yellow {dim $} phero client watch}.

    - When in a directory with multiple phero-projects, it will run
      the appropriate one of the above for each project.

    - When there's no phero-project found in the current directory, or
      in one of the direct child directories in it, it will prompt to
      initiate one for you (not implemented yet).

  When you're in need of any custom options, you cannot use this shortcut.
  Use {bold $ phero server} or {bold $ phero server} instead.

{dim Available commands}
  init, server, client

{dim Options}
  -h, --help        Output usage information
  -v, --version     Output the version number
  --verbose         Output debug information
`

export const pheroHelpInit = chalk`
{dim Usage}
  {yellow {dim $} phero {bold init}}
  {yellow {dim $} phero {bold init client}}
  {yellow {dim $} phero {bold init server}}

{dim Description}
  Initialises a phero server or client project. Assumes npm and TypeScript
  to be installed and ready:

    {yellow {dim $} npm init}
    {yellow {dim $} npm i typescript --save-dev}
    {yellow {dim $} npx tsc --init}
    {yellow {dim $} npx phero init}
`

export const serverHelp = chalk`
{dim Usage}
  {yellow {dim $} phero {bold server} [command] [options]}

{dim Available commands}
  serve, build

{dim Options}
  -h, --help        Output usage information
  -v, --version     Output the version number
`

export const serverHelpServe = chalk`
{dim Usage}
  {yellow {dim $} phero server {bold serve} [options]}

{dim Description}
  Watches changes in the phero-file and runs {yellow build} when it does.
  Also emits events for client-watch-processes and serves RPC's.

{dim Options}
  -h, --help          Output usage information
  --verbose           Output debug information
  -p, --port    3030  Custom port for the server to be running on
`

export const serverHelpExport = chalk`
{dim Usage}
  {yellow {dim $} phero server {bold export} [options]}

{dim Description}
  Takes a phero-file, parses it and generates a manifest and the
  RPC's for it. Assumes a phero-file at {yellow src/phero.ts}.

{dim Options}
  -h, --help        Output usage information
  --verbose         Output debug information
  --flavor          Provide the export flavor, must be either "nodejs", "gcloud-functions" or "vercel"
`

export const serverHelpBuild = chalk`
{dim Usage}
  {yellow {dim $} phero server {bold build} [options]}

{dim Description}
  Takes a phero-file, parses it and generates a manifest for it.
  Assumes a phero-file at {yellow src/phero.ts}.

{dim Options}
  -h, --help        Output usage information
  --verbose         Output debug information
`

export const clientHelp = chalk`
{dim Usage}
  {yellow {dim $} {bold phero client} [command] [options]}

{dim Available commands}
  watch, build

{dim Options}
  -h, --help        Output usage information
  -v, --version     Output the version number
`

export const clientHelpWatch = chalk`
{dim Usage}
  {yellow {dim $} phero client {bold watch} [server-url] [options]}

{dim Description}
  Connects to a dev-server and runs {yellow build} as soon as the
  manifest changes. The server can be located by its URL:

    {yellow {dim $} phero client build {bold http://localhost:8000}}

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
  {yellow {dim $} phero client {bold build} [server-location] [options]}

{dim Description}
  Takes the manifest from a server and generates a client for
  it. The server can be located by:

  - File location     {yellow {dim $} phero client build {bold ../api}}
  - URL               {yellow {dim $} phero client build {bold http://localhost:8000}}

  The default location of a server is http://localhost:3030.

{dim Options}
  -h, --help        Output usage information
  --verbose         Output debug information
`
