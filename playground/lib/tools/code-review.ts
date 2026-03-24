import { Tool } from '@avee1234/agent-kit';

export const analyzeCode = Tool.create({
  name: 'analyze_code',
  description: 'Analyze code for security vulnerabilities and style issues',
  parameters: { code: { type: 'string', description: 'The code to analyze' } },
  execute: async ({ code }) => {
    const issues: string[] = [];
    const s = code as string;
    if (s.includes('eval(')) issues.push('SECURITY: eval() usage — potential code injection');
    if (s.includes('innerHTML')) issues.push('SECURITY: innerHTML — potential XSS');
    if (/password|secret|api_key/i.test(s)) issues.push('SECURITY: Possible hardcoded credential');
    if (s.includes('var ')) issues.push('STYLE: Use const/let instead of var');
    if (s.includes('console.log')) issues.push('STYLE: Remove console.log before production');
    return issues.length > 0 ? issues.join('\n') : 'No issues found. Code looks clean.';
  },
});
