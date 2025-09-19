import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'OGRRE',
  tagline: 'Oil and Gas Regulatory Record Digitzer',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://catalog-historic-records.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/orphaned-wells-ui/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'CATALOG-HISTORIC-RECORDS', // Usually your GitHub org/user name.
  projectName: 'orphaned-wells-ui', // Usually your repo name.
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
        },
/*        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          //editUrl:
          //  'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        }, */
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  // Enable Mermaid
  markdown: {
    mermaid: true
  },
  themes: ['@docusaurus/theme-mermaid'],


  themeConfig: {
    // Replace with your project's social card
    image: 'img/ogrre-social-card.jpg',
    navbar: {
      title: 'OGRRE',
      logo: {
        alt: 'OGRRE Logo',
        src: 'img/ogrre-logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
       /*  {to: '/blog', label: 'Blog', position: 'left'},*/
        {
          href: 'https://github.com/CATALOG-Historic-Records/orphaned-wells-ui/',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Introduction',
              to: '/docs/about',
            },
            {
              label: 'Usage',
              to: '/docs/usage',
            },
          ],
        },
        /*
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/docusaurus',
            },
            {
              label: 'Discord',
              href: 'https://discordapp.com/invite/docusaurus',
            },
            {
              label: 'X',
              href: 'https://x.com/docusaurus',
            },
          ],
        },
        */
        {
          title: 'More',
          items: [
/*            {
              label: 'Blog',
              to: '/blog',
            },
            */
            {
              label: 'GitHub',
              href: 'https://github.com/CATALOG-Historic-Records/orphaned-wells-ui/',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Lawrence Berkeley National Laboratory`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
