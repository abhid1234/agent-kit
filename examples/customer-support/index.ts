import { Agent, Team, Tool } from 'agent-kit';

const customerMessage =
  process.argv[2] ?? "I never received my order #1042. It's been 2 weeks — where is it?";

// --- Tool ---

const lookupOrder = Tool.create({
  name: 'lookup_order',
  description: 'Look up order details by order ID',
  parameters: {
    order_id: { type: 'string', description: 'The order ID to look up', required: true },
  },
  execute: async (params) => {
    const orderId = params.order_id as string;
    const fakeOrders: Record<string, object> = {
      '1042': {
        id: '1042',
        status: 'delayed',
        item: 'Wireless Headphones',
        estimatedDelivery: '2026-03-28',
        carrier: 'FedEx',
        trackingNumber: 'FX9823741',
      },
      '1099': {
        id: '1099',
        status: 'delivered',
        item: 'Mechanical Keyboard',
        deliveredAt: '2026-03-20',
      },
      '1120': { id: '1120', status: 'processing', item: 'USB-C Hub', estimatedShip: '2026-03-25' },
    };
    const order = fakeOrders[orderId];
    return order ? JSON.stringify(order, null, 2) : `No order found with ID: ${orderId}`;
  },
});

// --- Agents ---

const supportAgent = new Agent({
  name: 'support-agent',
  tools: [lookupOrder],
  system: `You are a friendly customer support agent for an e-commerce store.
When a customer reports an issue, look up their order if they mention an order ID.
Draft a helpful, empathetic response that addresses their concern and provides next steps.`,
});

const qaReviewer = new Agent({
  name: 'qa-reviewer',
  system: `You are a QA reviewer for customer support responses.
Review the drafted response for: accuracy of information, empathetic tone, and clear next steps.
If the response is good, approve it with minor suggestions. If it needs significant changes, rewrite it.
Always output the final polished response that should be sent to the customer.`,
});

// --- Team ---

const team = new Team({
  agents: [supportAgent, qaReviewer],
  strategy: 'debate',
  maxRounds: 2,
});

// --- Event logging ---

team.on('team:start', (e) => {
  console.log(`\n[team] Starting (strategy: ${e.data.strategy})`);
  console.log(`[team] Customer message: "${customerMessage}"\n`);
});

team.on('team:round', (e) => {
  console.log(`\n[team] Round ${e.data.round}/${e.data.totalRounds}`);
});

team.on('team:agent:start', (e) => {
  const phase = e.data.phase === 'final' ? ' (final synthesis)' : '';
  console.log(`  [${e.data.agentName}] thinking${phase}...`);
});

team.on('team:agent:end', (e) => {
  console.log(`  [${e.data.agentName}] done (${e.latencyMs}ms)`);
});

team.on('team:end', (e) => {
  console.log(`\n[team] Done in ${e.latencyMs}ms\n`);
});

// --- Run ---

console.log('Customer Support Demo (debate strategy: support-agent + qa-reviewer)\n');

const result = await team.run(
  `A customer sent the following message. Draft and review a support response:\n\n"${customerMessage}"`,
);

console.log('=== Final Response to Customer ===\n');
console.log(result.content);

if (result.responses.length > 0) {
  console.log('\n=== Draft History ===\n');
  for (const r of result.responses) {
    const label = r.round != null ? ` (round ${r.round})` : '';
    console.log(`[${r.agent}${label}]:\n${r.content}\n`);
  }
}
