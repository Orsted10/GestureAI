'use client';

import dynamic from 'next/dynamic';

const CallPageClient = dynamic(() => import('./CallPageClient'), { ssr: false });

export default function CallPage() {
  return <CallPageClient />;
}
