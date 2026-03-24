import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { primary: '#0a0a1a', secondary: '#0d1117', panel: '#111827', card: '#1e1e3e' },
        border: { subtle: '#1f2937', hover: '#2a2a4a' },
        accent: {
          blue: '#60a5fa',
          green: '#34d399',
          yellow: '#fbbf24',
          purple: '#a78bfa',
          red: '#e94560',
        },
      },
      fontFamily: { mono: ['JetBrains Mono', 'monospace'] },
    },
  },
  plugins: [],
};
export default config;
