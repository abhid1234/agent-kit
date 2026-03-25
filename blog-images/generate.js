// Generate PNG screenshots of each blog diagram using Chrome headless
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const diagrams = {
  '01-problem-cards': `
    <div style="display:flex;gap:12px;flex-wrap:wrap;padding:24px;background:#0a0a1a;">
      <div style="flex:1;min-width:220px;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;border:1px solid #e94560;">
        <div style="font-size:14px;font-weight:700;color:#e94560;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">LangChain</div>
        <div style="font-size:13px;color:#a0a0b0;line-height:1.5;">Python-first, ported to JS as afterthought. 100+ classes to learn. Memory requires wiring 4-5 pieces together.</div>
        <div style="margin-top:12px;font-size:12px;color:#e94560;font-weight:600;">VERDICT: Too complex</div>
      </div>
      <div style="flex:1;min-width:220px;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;border:1px solid #e94560;">
        <div style="font-size:14px;font-weight:700;color:#e94560;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Vercel AI SDK</div>
        <div style="font-size:13px;color:#a0a0b0;line-height:1.5;">Great streaming UX, but optimized for chat UI. No built-in memory. Every conversation starts from scratch.</div>
        <div style="margin-top:12px;font-size:12px;color:#e94560;font-weight:600;">VERDICT: No memory</div>
      </div>
      <div style="flex:1;min-width:220px;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;border:1px solid #e94560;">
        <div style="font-size:14px;font-weight:700;color:#e94560;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">CrewAI</div>
        <div style="font-size:13px;color:#a0a0b0;line-height:1.5;">Has the multi-agent model I wanted, but it's Python-only. Not an option for a TypeScript codebase.</div>
        <div style="margin-top:12px;font-size:12px;color:#e94560;font-weight:600;">VERDICT: Wrong language</div>
      </div>
    </div>`,

  '02-four-concepts': `
    <div style="background:linear-gradient(135deg,#0f0f23 0%,#1a1a3e 100%);border-radius:16px;padding:32px;border:1px solid #2a2a4a;">
      <div style="text-align:center;margin-bottom:24px;"><span style="font-size:13px;color:#888;text-transform:uppercase;letter-spacing:2px;">Everything you need to learn</span></div>
      <div style="display:flex;justify-content:center;gap:16px;flex-wrap:wrap;">
        <div style="background:#1e1e3e;border:2px solid #7c3aed;border-radius:12px;padding:16px 24px;text-align:center;min-width:120px;"><div style="font-size:28px;margin-bottom:4px;">🤖</div><div style="font-size:16px;font-weight:700;color:#a78bfa;">Agent</div><div style="font-size:11px;color:#888;margin-top:4px;">Orchestrator</div></div>
        <div style="display:flex;align-items:center;color:#444;font-size:24px;">→</div>
        <div style="background:#1e1e3e;border:2px solid #2563eb;border-radius:12px;padding:16px 24px;text-align:center;min-width:120px;"><div style="font-size:28px;margin-bottom:4px;">🔧</div><div style="font-size:16px;font-weight:700;color:#60a5fa;">Tool</div><div style="font-size:11px;color:#888;margin-top:4px;">Actions</div></div>
        <div style="display:flex;align-items:center;color:#444;font-size:24px;">→</div>
        <div style="background:#1e1e3e;border:2px solid #059669;border-radius:12px;padding:16px 24px;text-align:center;min-width:120px;"><div style="font-size:28px;margin-bottom:4px;">🧠</div><div style="font-size:16px;font-weight:700;color:#34d399;">Memory</div><div style="font-size:11px;color:#888;margin-top:4px;">Persistence</div></div>
        <div style="display:flex;align-items:center;color:#444;font-size:24px;">→</div>
        <div style="background:#1e1e3e;border:2px solid #d97706;border-radius:12px;padding:16px 24px;text-align:center;min-width:120px;"><div style="font-size:28px;margin-bottom:4px;">👥</div><div style="font-size:16px;font-weight:700;color:#fbbf24;">Team</div><div style="font-size:11px;color:#888;margin-top:4px;">Coordination</div></div>
      </div>
      <div style="text-align:center;margin-top:20px;"><span style="font-size:12px;color:#666;">That's it. 4 concepts. Not 100+ classes.</span></div>
    </div>`,

  '03-memory-terminal': `
    <div style="background:#0f0f23;border-radius:16px;padding:0;overflow:hidden;border:1px solid #2a2a4a;font-family:'SF Mono','Fira Code',monospace;">
      <div style="padding:20px 24px;border-bottom:1px solid #2a2a4a;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;"><div style="width:10px;height:10px;border-radius:50%;background:#34d399;"></div><span style="font-size:13px;color:#34d399;font-weight:600;">SESSION 1 — Running</span></div>
        <div style="font-size:13px;line-height:1.8;"><div><span style="color:#60a5fa;">❯</span> <span style="color:#e2e8f0;">agent.chat("My project uses PostgreSQL, deployed on Fly.io")</span></div><div style="color:#a0a0b0;padding-left:16px;">→ "Got it! I'll remember your stack: PostgreSQL + Fly.io"</div><div style="margin-top:8px;"><span style="color:#60a5fa;">❯</span> <span style="color:#e2e8f0;">process.exit(0)</span></div></div>
      </div>
      <div style="padding:12px 24px;background:linear-gradient(90deg,#1a0a0a,#0f0f23);border-bottom:1px solid #2a2a4a;">
        <div style="display:flex;align-items:center;gap:8px;"><div style="width:10px;height:10px;border-radius:50%;background:#e94560;"></div><span style="font-size:13px;color:#e94560;font-weight:600;">PROCESS KILLED</span><span style="font-size:12px;color:#666;margin-left:auto;">memory.db persists on disk →</span></div>
      </div>
      <div style="padding:20px 24px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;"><div style="width:10px;height:10px;border-radius:50%;background:#34d399;"></div><span style="font-size:13px;color:#34d399;font-weight:600;">SESSION 2 — New Process</span></div>
        <div style="font-size:13px;line-height:1.8;"><div><span style="color:#60a5fa;">❯</span> <span style="color:#e2e8f0;">agent.chat("What database am I using?")</span></div><div style="color:#34d399;padding-left:16px;font-weight:600;">→ "Based on our previous conversation, you're using PostgreSQL,</div><div style="color:#34d399;padding-left:28px;font-weight:600;">deployed on Fly.io."</div></div>
      </div>
    </div>`,

  '04-memory-pipeline': `
    <div style="background:linear-gradient(135deg,#0a1628 0%,#0f0f23 100%);border-radius:16px;padding:24px;border:1px solid #1e3a5f;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
      <div style="font-size:13px;font-weight:700;color:#60a5fa;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">How Memory Works Under the Hood</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:stretch;">
        <div style="flex:1;min-width:180px;background:#111827;border-radius:10px;padding:16px;border:1px solid #1f2937;"><div style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Short-Term</div><div style="font-size:14px;color:#e5e7eb;line-height:1.5;">Sliding window of last 20 messages. Always in context.</div></div>
        <div style="display:flex;align-items:center;color:#374151;font-size:20px;">→</div>
        <div style="flex:1;min-width:180px;background:#111827;border-radius:10px;padding:16px;border:1px solid #1f2937;"><div style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Summarization</div><div style="font-size:14px;color:#e5e7eb;line-height:1.5;">Old messages auto-summarized by the model and stored.</div></div>
        <div style="display:flex;align-items:center;color:#374151;font-size:20px;">→</div>
        <div style="flex:1;min-width:180px;background:#111827;border-radius:10px;padding:16px;border:1px solid #1f2937;"><div style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Long-Term</div><div style="font-size:14px;color:#e5e7eb;line-height:1.5;">Semantic search over summaries. Keyword or embedding-based.</div></div>
      </div>
    </div>`,

  '05-strategies': `
    <div style="background:#0f0f23;border-radius:16px;padding:24px;border:1px solid #2a2a4a;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
      <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #1a1a3e;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;"><span style="background:#7c3aed;color:white;font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px;text-transform:uppercase;letter-spacing:1px;">Sequential</span><span style="color:#888;font-size:13px;">Pipeline — each agent builds on the previous</span></div>
        <div style="display:flex;align-items:center;gap:8px;padding:8px 0;flex-wrap:wrap;"><div style="background:#1e1e3e;border:1px solid #7c3aed;border-radius:8px;padding:8px 14px;font-size:13px;color:#a78bfa;font-weight:600;">Researcher</div><span style="color:#444;">→</span><div style="background:#1e1e3e;border:1px solid #7c3aed;border-radius:8px;padding:8px 14px;font-size:13px;color:#a78bfa;font-weight:600;">Analyst</div><span style="color:#444;">→</span><div style="background:#1e1e3e;border:1px solid #7c3aed;border-radius:8px;padding:8px 14px;font-size:13px;color:#a78bfa;font-weight:600;">Writer</div><span style="color:#444;">→</span><div style="background:#7c3aed;border-radius:8px;padding:8px 14px;font-size:13px;color:white;font-weight:600;">Output</div></div>
      </div>
      <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #1a1a3e;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;"><span style="background:#2563eb;color:white;font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px;text-transform:uppercase;letter-spacing:1px;">Parallel</span><span style="color:#888;font-size:13px;">Multiple perspectives on the same input</span></div>
        <div style="display:flex;align-items:center;gap:8px;padding:8px 0;"><div style="display:flex;flex-direction:column;gap:6px;"><div style="background:#1e1e3e;border:1px solid #2563eb;border-radius:8px;padding:6px 14px;font-size:13px;color:#60a5fa;font-weight:600;">Security Review</div><div style="background:#1e1e3e;border:1px solid #2563eb;border-radius:8px;padding:6px 14px;font-size:13px;color:#60a5fa;font-weight:600;">Style Review</div><div style="background:#1e1e3e;border:1px solid #2563eb;border-radius:8px;padding:6px 14px;font-size:13px;color:#60a5fa;font-weight:600;">Perf Review</div></div><span style="color:#444;font-size:18px;">⟹</span><div style="background:#2563eb;border-radius:8px;padding:8px 14px;font-size:13px;color:white;font-weight:600;">Merged Output</div></div>
      </div>
      <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #1a1a3e;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;"><span style="background:#059669;color:white;font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px;text-transform:uppercase;letter-spacing:1px;">Debate</span><span style="color:#888;font-size:13px;">Adversarial refinement across rounds</span></div>
        <div style="display:flex;align-items:center;gap:8px;padding:8px 0;flex-wrap:wrap;"><div style="background:#1e1e3e;border:1px solid #059669;border-radius:8px;padding:6px 12px;font-size:12px;color:#34d399;">Proposer: draft</div><span style="color:#444;">→</span><div style="background:#1e1e3e;border:1px solid #059669;border-radius:8px;padding:6px 12px;font-size:12px;color:#34d399;">Critic: feedback</div><span style="color:#444;">→</span><div style="background:#1e1e3e;border:1px solid #059669;border-radius:8px;padding:6px 12px;font-size:12px;color:#34d399;">Proposer: revise</div><span style="color:#444;">→</span><div style="background:#1e1e3e;border:1px solid #059669;border-radius:8px;padding:6px 12px;font-size:12px;color:#34d399;">Critic: approve</div><span style="color:#444;">→</span><div style="background:#059669;border-radius:8px;padding:6px 12px;font-size:12px;color:white;font-weight:600;">Final</div></div>
      </div>
      <div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;"><span style="background:#d97706;color:white;font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px;text-transform:uppercase;letter-spacing:1px;">Hierarchical</span><span style="color:#888;font-size:13px;">Manager delegates to specialists</span></div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:8px 0;"><div style="background:#d97706;border-radius:8px;padding:8px 20px;font-size:13px;color:white;font-weight:600;">Manager</div><div style="color:#444;font-size:14px;">↙ ↓ ↘</div><div style="display:flex;gap:8px;"><div style="background:#1e1e3e;border:1px solid #d97706;border-radius:8px;padding:6px 14px;font-size:13px;color:#fbbf24;font-weight:600;">Researcher</div><div style="background:#1e1e3e;border:1px solid #d97706;border-radius:8px;padding:6px 14px;font-size:13px;color:#fbbf24;font-weight:600;">Writer</div><div style="background:#1e1e3e;border:1px solid #d97706;border-radius:8px;padding:6px 14px;font-size:13px;color:#fbbf24;font-weight:600;">Critic</div></div></div>
      </div>
    </div>`,

  '06-observability': `
    <div style="background:#0f0f23;border-radius:12px;padding:20px 24px;font-family:'SF Mono','Fira Code',monospace;font-size:13px;line-height:1.8;border:1px solid #2a2a4a;">
      <div style="color:#888;margin-bottom:4px;">// Subscribe to everything</div>
      <div style="color:#e2e8f0;">agent.on('*', (e) => console.log(e));</div>
      <div style="margin:12px 0;border-top:1px solid #1a1a3e;"></div>
      <div><span style="color:#fbbf24;">tool:start</span> <span style="color:#888;">web_search({ query: "mamba architecture" })</span></div>
      <div><span style="color:#34d399;">tool:end  </span> <span style="color:#888;">web_search → 340ms</span></div>
      <div><span style="color:#60a5fa;">message  </span> <span style="color:#888;">"I found 3 papers on Mamba..." → 1204ms, 87 tokens</span></div>
      <div><span style="color:#a78bfa;">memory   </span> <span style="color:#888;">retrieved 2 summaries, saved exchange</span></div>
    </div>`,

  '07-comparison': `
    <div style="background:#0f0f23;border-radius:16px;overflow:hidden;border:1px solid #2a2a4a;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#1a1a3e;"><th style="padding:12px 16px;text-align:left;color:#888;font-weight:600;border-bottom:1px solid #2a2a4a;"></th><th style="padding:12px 16px;text-align:center;color:#888;font-weight:600;border-bottom:1px solid #2a2a4a;">LangChain</th><th style="padding:12px 16px;text-align:center;color:#888;font-weight:600;border-bottom:1px solid #2a2a4a;">Vercel AI SDK</th><th style="padding:12px 16px;text-align:center;color:#888;font-weight:600;border-bottom:1px solid #2a2a4a;">CrewAI</th><th style="padding:12px 16px;text-align:center;color:#60a5fa;font-weight:700;border-bottom:1px solid #2a2a4a;">agent-kit</th></tr></thead>
        <tbody>
          <tr><td style="padding:10px 16px;color:#e5e7eb;border-bottom:1px solid #1a1a3e;">Language</td><td style="padding:10px 16px;text-align:center;color:#a0a0b0;border-bottom:1px solid #1a1a3e;">Python-first</td><td style="padding:10px 16px;text-align:center;color:#a0a0b0;border-bottom:1px solid #1a1a3e;">TypeScript</td><td style="padding:10px 16px;text-align:center;color:#a0a0b0;border-bottom:1px solid #1a1a3e;">Python</td><td style="padding:10px 16px;text-align:center;color:#34d399;font-weight:600;border-bottom:1px solid #1a1a3e;">TypeScript-first</td></tr>
          <tr><td style="padding:10px 16px;color:#e5e7eb;border-bottom:1px solid #1a1a3e;">Learning curve</td><td style="padding:10px 16px;text-align:center;color:#e94560;border-bottom:1px solid #1a1a3e;">100+ classes</td><td style="padding:10px 16px;text-align:center;color:#34d399;border-bottom:1px solid #1a1a3e;">Low</td><td style="padding:10px 16px;text-align:center;color:#fbbf24;border-bottom:1px solid #1a1a3e;">Medium</td><td style="padding:10px 16px;text-align:center;color:#34d399;font-weight:600;border-bottom:1px solid #1a1a3e;">4 concepts</td></tr>
          <tr><td style="padding:10px 16px;color:#e5e7eb;border-bottom:1px solid #1a1a3e;">Memory</td><td style="padding:10px 16px;text-align:center;color:#fbbf24;border-bottom:1px solid #1a1a3e;">Manual setup</td><td style="padding:10px 16px;text-align:center;color:#e94560;border-bottom:1px solid #1a1a3e;">None</td><td style="padding:10px 16px;text-align:center;color:#fbbf24;border-bottom:1px solid #1a1a3e;">Basic</td><td style="padding:10px 16px;text-align:center;color:#34d399;font-weight:600;border-bottom:1px solid #1a1a3e;">Built-in + semantic</td></tr>
          <tr><td style="padding:10px 16px;color:#e5e7eb;border-bottom:1px solid #1a1a3e;">Multi-agent</td><td style="padding:10px 16px;text-align:center;color:#fbbf24;border-bottom:1px solid #1a1a3e;">LangGraph</td><td style="padding:10px 16px;text-align:center;color:#e94560;border-bottom:1px solid #1a1a3e;">None</td><td style="padding:10px 16px;text-align:center;color:#34d399;border-bottom:1px solid #1a1a3e;">Core feature</td><td style="padding:10px 16px;text-align:center;color:#34d399;font-weight:600;border-bottom:1px solid #1a1a3e;">4 strategies</td></tr>
          <tr><td style="padding:10px 16px;color:#e5e7eb;">Observability</td><td style="padding:10px 16px;text-align:center;color:#e94560;">LangSmith (paid)</td><td style="padding:10px 16px;text-align:center;color:#e94560;">None</td><td style="padding:10px 16px;text-align:center;color:#fbbf24;">Basic</td><td style="padding:10px 16px;text-align:center;color:#34d399;font-weight:600;">Built-in, free</td></tr>
        </tbody>
      </table>
    </div>`,

  '08-lessons': `
    <div style="display:flex;flex-direction:column;gap:12px;padding:24px;background:#0a0a1a;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
      <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;border-left:4px solid #7c3aed;"><div style="font-size:15px;font-weight:700;color:#a78bfa;margin-bottom:6px;">1. Ship the monolith first, split packages later</div><div style="font-size:14px;color:#a0a0b0;line-height:1.6;">I initially considered a monorepo before I had a working v1. A single package got to "working" faster, and the internal plugin boundaries mean I can split later without breaking anyone.</div></div>
      <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;border-left:4px solid #2563eb;"><div style="font-size:15px;font-weight:700;color:#60a5fa;margin-bottom:6px;">2. Keyword search before embeddings</div><div style="font-size:14px;color:#a0a0b0;line-height:1.6;">For most use cases, keyword search over conversation summaries is fast and good enough. Embeddings add latency and an extra model dependency.</div></div>
      <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;border-left:4px solid #059669;"><div style="font-size:15px;font-weight:700;color:#34d399;margin-bottom:6px;">3. TDD from the start</div><div style="font-size:14px;color:#a0a0b0;line-height:1.6;">The places where tests felt hard to write were places where the API design was wrong. 138 tests — I wish I'd written them before the code, not after.</div></div>
    </div>`,

  '09-examples': `
    <div style="background:linear-gradient(135deg,#0a1628 0%,#0f0f23 100%);border-radius:16px;padding:24px;border:1px solid #1e3a5f;text-align:center;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
      <div style="font-size:16px;color:#e5e7eb;margin-bottom:16px;">4 examples to get started</div>
      <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
        <div style="background:#111827;border:1px solid #1f2937;border-radius:8px;padding:10px 16px;"><div style="font-size:13px;color:#60a5fa;font-weight:600;">research-assistant</div><div style="font-size:11px;color:#888;">Agent + Tool + Memory</div></div>
        <div style="background:#111827;border:1px solid #1f2937;border-radius:8px;padding:10px 16px;"><div style="font-size:13px;color:#fbbf24;font-weight:600;">research-team</div><div style="font-size:11px;color:#888;">Hierarchical Team</div></div>
        <div style="background:#111827;border:1px solid #1f2937;border-radius:8px;padding:10px 16px;"><div style="font-size:13px;color:#34d399;font-weight:600;">customer-support</div><div style="font-size:11px;color:#888;">Debate Strategy</div></div>
        <div style="background:#111827;border:1px solid #1f2937;border-radius:8px;padding:10px 16px;"><div style="font-size:13px;color:#a78bfa;font-weight:600;">code-reviewer</div><div style="font-size:11px;color:#888;">Parallel Strategy</div></div>
      </div>
    </div>`,
};

// Generate each diagram as a standalone HTML, then screenshot with Chrome
for (const [name, html] of Object.entries(diagrams)) {
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#0a0a1a;}</style></head><body>${html}</body></html>`;
  const tmpFile = `/tmp/diagram-${name}.html`;
  writeFileSync(tmpFile, fullHtml);

  try {
    execSync(
      `google-chrome --headless --disable-gpu --no-sandbox --screenshot=/home/abhidaas/Core/Workspace/ClaudeCode/ai-agent-framework/blog-images/${name}.png --window-size=800,600 --default-background-color=0 "file://${tmpFile}"`,
      { stdio: 'pipe' },
    );
    console.log(`✓ ${name}.png`);
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`);
  }
}
