// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github")
const darkCodeTheme = require("prism-react-renderer/themes/dracula")

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Phero",
  tagline: "The no-hassle and type-safe glue between your backend and frontend",
  url: "https://docs.phero.dev",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "phero-hq", // Usually your GitHub org/user name.
  projectName: "phero", // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
        },
        // blog: {
        //   showReadingTime: true,
        //   // Please change this to your repo.
        //   // Remove this to remove the "edit this page" links.
        //   editUrl:
        //     "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
        // },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "Phero",
        logo: {
          alt: "Phero",
          src: "img/logo.svg",
        },
        items: [
          // {
          //   type: "doc",
          //   docId: "Introduction",
          //   position: "left",
          //   label: "Docs",
          // },
          // {to: '/blog', label: 'Blog', position: 'left'},
          {
            href: "https://github.com/phero-hq/phero",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      // footer: {
      //   style: "dark",
      //   links: [
      //     // {
      //     //   title: "Docs",
      //     //   items: [
      //     //     {
      //     //       label: "Tutorial",
      //     //       to: "/docs/introduction",
      //     //     },
      //     //   ],
      //     // },
      //     {
      //       title: "Community",
      //       items: [
      //         // {
      //         //   label: 'Stack Overflow',
      //         //   href: 'https://stackoverflow.com/questions/tagged/docusaurus',
      //         // },
      //         {
      //           label: "Discord",
      //           href: "https://discordapp.com/invite/TODO",
      //         },
      //         {
      //           label: "Twitter",
      //           href: "https://twitter.com/PheroHQ",
      //         },
      //       ],
      //     },
      //     {
      //       title: "More",
      //       items: [
      //         // {
      //         //   label: 'Blog',
      //         //   to: '/blog',
      //         // },
      //         {
      //           label: "GitHub",
      //           href: "https://github.com/facebook/docusaurus",
      //         },
      //       ],
      //     },
      //   ],
      //   copyright: `Copyright © ${new Date().getFullYear()} Phero, Inc. Built with Docusaurus.`,
      // },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
}

module.exports = config
