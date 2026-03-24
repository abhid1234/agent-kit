import { Tool } from '@avee1234/agent-kit';

const orders: Record<string, { status: string; item: string; eta: string }> = {
  '1042': { status: 'Shipped', item: 'Wireless Headphones', eta: 'March 26' },
  '1099': { status: 'Processing', item: 'Mechanical Keyboard', eta: 'March 28' },
  '1120': { status: 'Delivered', item: 'USB-C Hub', eta: 'Delivered March 22' },
};

export const lookupOrder = Tool.create({
  name: 'lookup_order',
  description: 'Look up an order by order ID',
  parameters: { orderId: { type: 'string', description: 'The order ID' } },
  execute: async ({ orderId }) => {
    const order = orders[orderId as string];
    if (!order) return `Order #${orderId} not found. Valid demo orders: 1042, 1099, 1120.`;
    return JSON.stringify({ orderId, ...order });
  },
});
