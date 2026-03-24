import { Agent, Team } from 'agent-kit';
import { readFileSync } from 'fs';

const filePath = process.argv[2];

const defaultCode = `
async function fetchUserData(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId;
  const result = await db.execute(query);
  var password = result[0].password;
  console.log("User password:", password);
  return result[0];
}

function parseConfig(input) {
  return eval(input);
}

const SECRET_KEY = "hardcoded-secret-abc123";
`.trim();

const code = filePath
  ? (() => {
      try {
        return readFileSync(filePath, 'utf-8');
      } catch {
        console.error(`Could not read file: ${filePath}`);
        process.exit(1);
      }
    })()
  : defaultCode;

const codeLabel = filePath ?? '(built-in example snippet)';

// --- Agents ---

const securityReviewer = new Agent({
  name: 'security-reviewer',
  system: `You are a security-focused code reviewer.
Analyze the provided code for vulnerabilities such as: SQL injection, hardcoded secrets,
use of unsafe functions (eval, exec), exposed sensitive data, and insecure defaults.
For each issue found, state: severity (critical/high/medium/low), the line or pattern, and how to fix it.
If no issues are found, say so clearly.`,
});

const styleReviewer = new Agent({
  name: 'style-reviewer',
  system: `You are a code quality and style reviewer.
Analyze the provided code for: naming conventions, use of var vs let/const, error handling,
dead code, readability, and best practices.
For each issue found, state: the specific problem and a concrete suggestion to improve it.
If the code is well-written, say so clearly.`,
});

// --- Team ---

const team = new Team({
  agents: [securityReviewer, styleReviewer],
  strategy: 'parallel',
});

// --- Event logging ---

team.on('team:start', (e) => {
  console.log(`\n[team] Starting (strategy: ${e.data.strategy}, agents: ${e.data.agentCount})`);
  console.log(`[team] Reviewing: ${codeLabel}\n`);
});

team.on('team:agent:start', (e) => {
  console.log(`  [${e.data.agentName}] analyzing...`);
});

team.on('team:agent:end', (e) => {
  console.log(`  [${e.data.agentName}] done (${e.latencyMs}ms)`);
});

team.on('team:end', (e) => {
  console.log(`\n[team] Done in ${e.latencyMs}ms\n`);
});

// --- Run ---

console.log(`Code Reviewer Demo (parallel strategy: security + style)\n`);

const task = `Review the following code:\n\n\`\`\`\n${code}\n\`\`\``;

const result = await team.run(task);

console.log('=== Code Review Results ===\n');

for (const r of result.responses) {
  console.log(`--- ${r.agent.toUpperCase()} ---\n`);
  console.log(r.content);
  console.log();
}
