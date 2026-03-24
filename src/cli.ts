#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const command = args[0];
const projectName = args[1] ?? 'my-agent';

if (command !== 'init') {
  console.error(`Unknown command: ${command}`);
  console.error('Usage: agent-kit init [project-name]');
  process.exit(1);
}

const targetDir = path.resolve(process.cwd(), projectName);

if (fs.existsSync(targetDir)) {
  console.error(`Directory already exists: ${targetDir}`);
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

const packageJson = {
  name: projectName,
  version: '1.0.0',
  private: true,
  type: 'module',
  scripts: {
    start: 'npx tsx agent.ts',
  },
  dependencies: {
    '@avee1234/agent-kit': '^0.2.0',
  },
  devDependencies: {
    tsx: '^4.0.0',
  },
};

const agentTs = `import { Agent, Tool, Memory } from '@avee1234/agent-kit';

const greet = Tool.create({
  name: 'greet',
  description: 'Greet someone by name',
  parameters: {
    name: { type: 'string', description: 'Name to greet' },
  },
  execute: async ({ name }) => \`Hello, \${name}!\`,
});

const agent = new Agent({
  name: 'my-agent',
  memory: new Memory({ store: 'sqlite', path: './memory.db' }),
  tools: [greet],
  system: 'You are a helpful assistant.',
});

const response = await agent.chat(process.argv[2] ?? 'Hello!');
console.log(response.content);
`;

const readmeMd = `# ${projectName}

Built with [agent-kit](https://github.com/abhid1234/agent-kit).

## Quick Start

\`\`\`bash
npm install
npm start "Hello, what can you do?"
\`\`\`
`;

fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n');
fs.writeFileSync(path.join(targetDir, 'agent.ts'), agentTs);
fs.writeFileSync(path.join(targetDir, 'README.md'), readmeMd);

console.log(`\nScaffolded project: ${projectName}\n`);
console.log('Next steps:\n');
console.log(`  cd ${projectName}`);
console.log('  npm install');
console.log('  npm start "Hello, what can you do?"\n');
