import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    'quick-start',
    {
      type: 'category',
      label: 'Core Concepts',
      items: ['core/agent', 'core/tool', 'core/memory', 'core/team'],
    },
    {
      type: 'category',
      label: 'Guides',
      items: ['guides/model-configuration', 'guides/custom-memory-store', 'guides/embeddings'],
    },
    'examples',
  ],
};

export default sidebars;
