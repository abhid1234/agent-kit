import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'agent-kit',
  tagline: 'TypeScript-first AI agent framework',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://github.com',
  baseUrl: '/',

  organizationName: 'avee1234',
  projectName: 'ai-agent-framework',

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

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
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'agent-kit',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/avee1234/ai-agent-framework',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://www.npmjs.com/package/@avee1234/agent-kit',
          label: 'npm',
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
            { label: 'Introduction', to: '/' },
            { label: 'Quick Start', to: '/quick-start' },
          ],
        },
        {
          title: 'Core Concepts',
          items: [
            { label: 'Agent', to: '/core/agent' },
            { label: 'Tool', to: '/core/tool' },
            { label: 'Memory', to: '/core/memory' },
            { label: 'Team', to: '/core/team' },
          ],
        },
        {
          title: 'Links',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/avee1234/ai-agent-framework',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/@avee1234/agent-kit',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} agent-kit. MIT License.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['typescript', 'bash'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
