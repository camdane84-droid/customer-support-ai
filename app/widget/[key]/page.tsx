import type { Metadata } from 'next';
import ChatWidget from '@/components/widget/ChatWidget';

export const metadata: Metadata = {
  title: 'Chat',
  robots: { index: false, follow: false },
};

/**
 * Iframe content for the embeddable chat widget. Loaded by public/widget.js
 * on customer websites — must never assume a logged-in user.
 */
export default async function WidgetPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return <ChatWidget widgetKey={key} />;
}
