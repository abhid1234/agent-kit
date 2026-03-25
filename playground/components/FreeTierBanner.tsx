'use client';
import { signIn } from 'next-auth/react';

interface FreeTierBannerProps {
  messageCount: number;
  messageLimit: number;
  limitReached: boolean;
}

export function FreeTierBanner({ messageCount, messageLimit, limitReached }: FreeTierBannerProps) {
  if (limitReached) {
    return (
      <div className="mx-3 mb-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
        <div className="text-sm text-amber-400 font-medium mb-1">Free tier limit reached</div>
        <div className="text-xs text-gray-400 mb-2">Sign in with Google for unlimited access</div>
        <button
          onClick={() => signIn('google')}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  const remaining = messageLimit - messageCount;
  if (remaining > 20) return null; // Only show when getting low

  return (
    <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-center">
      <span className="text-xs text-gray-400">{remaining} free messages remaining</span>
      <span className="text-xs text-gray-600 mx-1">·</span>
      <button onClick={() => signIn('google')} className="text-xs text-accent-blue hover:underline">
        Sign in for unlimited
      </button>
    </div>
  );
}
