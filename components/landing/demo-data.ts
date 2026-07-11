import {
  Instagram,
  Mail,
  MessageCircle,
  MessageSquare,
  Facebook,
} from 'lucide-react';
import { createElement } from 'react';

// =============================================================================
// TYPES
// =============================================================================
export type ChannelType = 'instagram' | 'whatsapp' | 'tiktok' | 'email' | 'facebook' | 'sms';

export interface DemoMessage {
  from: 'customer' | 'support';
  text: string;
  time: string;
  isAiGenerated?: boolean;
}

export interface DemoConversation {
  id: string;
  initials: string;
  name: string;
  channel: ChannelType;
  /** Business address the email was sent to (shown as "to orders@…") */
  address?: string;
  gradient: string;
  messages: DemoMessage[];
}

export interface AutoReplyMessage {
  from: 'customer' | 'ai';
  text: string;
  time: string;
  isOrderCard?: boolean;
  orderDetails?: {
    items: { name: string; qty: number; price: number }[];
    shipping: string;
    shippingCost: number;
    total: number;
    delivery: string;
  };
}

export interface AutoReplyConversation {
  id: string;
  initials: string;
  name: string;
  channel: ChannelType;
  /** Business address the email was sent to (shown as "to orders@…") */
  address?: string;
  gradient: string;
  preview: string;
  time: string;
  urgent?: boolean;
  messages: AutoReplyMessage[];
}

export interface ChannelConfig {
  icon: React.ReactNode;
  badgeColor: string;
  iconColor: string;
}

// =============================================================================
// CHANNEL CONFIG — icons and colors for each channel type
// =============================================================================
const TikTokIcon = createElement(
  'svg',
  { className: 'w-3 h-3', viewBox: '0 0 24 24', fill: 'currentColor' },
  createElement('path', {
    d: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z',
  })
);

export const channelConfig: Record<ChannelType, ChannelConfig> = {
  instagram: {
    icon: createElement(Instagram, { className: 'w-3 h-3' }),
    badgeColor: 'bg-gradient-to-br from-pink-500 to-purple-600',
    iconColor: 'text-pink-400',
  },
  whatsapp: {
    icon: createElement(MessageCircle, { className: 'w-3 h-3' }),
    badgeColor: 'bg-emerald-500',
    iconColor: 'text-emerald-400',
  },
  tiktok: {
    icon: TikTokIcon,
    badgeColor: 'bg-black',
    iconColor: 'text-current',
  },
  email: {
    icon: createElement(Mail, { className: 'w-3 h-3' }),
    badgeColor: 'bg-blue-500',
    iconColor: 'text-slate-400',
  },
  facebook: {
    icon: createElement(Facebook, { className: 'w-3 h-3' }),
    badgeColor: 'bg-blue-600',
    iconColor: 'text-blue-400',
  },
  sms: {
    icon: createElement(MessageSquare, { className: 'w-3 h-3' }),
    badgeColor: 'bg-green-500',
    iconColor: 'text-green-400',
  },
};

// =============================================================================
// HELPERS
// =============================================================================
export const formatNameForNarrow = (name: string): string => {
  if (name.startsWith('+')) {
    return name.replace(/^\+\d+\s*/, '');
  }
  return name;
};

export const isPhoneNumber = (name: string): boolean => {
  return name.startsWith('+') || /^\d{3}[-.\s]?\d{3}[-.\s]?\d{4}$/.test(name);
};

// =============================================================================
// DEMO CONVERSATIONS — Add new conversations here!
// =============================================================================
export const demoConversations: DemoConversation[] = [
  {
    id: 'sarah',
    initials: 'SC',
    name: 'Sarah Chen',
    channel: 'email',
    address: 'hello@roastco.com',
    gradient: 'from-purple-500 to-purple-700',
    messages: [
      { from: 'customer', text: 'Hi! Do you have any decaf coffee options? I love coffee but can\'t have caffeine \u{1F60A}', time: '2m ago' },
      { from: 'support', text: 'Yes! We have 3 delicious decaf options: Swiss Water Decaf, French Vanilla Decaf, and Hazelnut Decaf \u2615', time: '1m ago' },
      { from: 'customer', text: 'Perfect! Which one is most popular?', time: '30s ago' },
      { from: 'support', text: 'Our Swiss Water Decaf is definitely the customer favorite! It has a smooth, rich flavor \u{1F31F}', time: 'Just now', isAiGenerated: true },
    ],
  },
  {
    id: 'jr',
    initials: 'JR',
    name: 'Jordan Reyes',
    channel: 'email',
    address: 'orders@roastco.com',
    gradient: 'from-emerald-400 to-teal-600',
    messages: [
      { from: 'customer', text: 'Hi, can I still change the shipping address on order #4788? It hasn\'t shipped yet, right?', time: '5m ago' },
      { from: 'support', text: 'Hi Jordan! You\'re in luck \u2014 it ships tomorrow morning. Send over the new address and I\'ll update it.', time: '4m ago' },
      { from: 'customer', text: '123 Bayview Ave, Oakland, CA 94610. Thank you!', time: '3m ago' },
      { from: 'support', text: 'Updated! Your order will ship to 123 Bayview Ave tomorrow \u{1F4E6}', time: '2m ago', isAiGenerated: true },
    ],
  },
  {
    id: 'latte',
    initials: 'LC',
    name: 'Lena Cortez',
    channel: 'email',
    address: 'wholesale@roastco.com',
    gradient: 'from-cyan-400 to-pink-600',
    messages: [
      { from: 'customer', text: 'Hi there! I run a cafe in Portland \u2014 do you offer wholesale pricing?', time: '10m ago' },
      { from: 'support', text: 'Hi Lena! \u{1F64F} Yes, we do wholesale! What quantities are you looking for?', time: '8m ago' },
      { from: 'customer', text: 'Around 50 bags per month for my cafe', time: '5m ago' },
      { from: 'support', text: 'Perfect! I\'ll send you our wholesale pricing guide. You\'ll get 20% off at that volume! \u{1F4E7}', time: '3m ago' },
    ],
  },
  {
    id: 'mike',
    initials: 'MC',
    name: 'Mike Chen',
    channel: 'email',
    address: 'support@roastco.com',
    gradient: 'from-blue-400 to-indigo-600',
    messages: [
      { from: 'customer', text: 'Hi, I ordered last week but haven\'t received tracking info yet. Order #4521', time: '1h ago' },
      { from: 'support', text: 'Hi Mike! Let me check on that for you right away.', time: '45m ago' },
      { from: 'support', text: 'Found it! Your order shipped yesterday. Tracking: 1Z999AA10123456784. Should arrive Thursday! \u{1F4E6}', time: '40m ago' },
      { from: 'customer', text: 'Thanks for the quick response!', time: '30m ago' },
    ],
  },
  {
    id: 'alex',
    initials: 'AB',
    name: 'Alex Brooks',
    channel: 'email',
    address: 'hello@roastco.com',
    gradient: 'from-orange-400 to-rose-600',
    messages: [
      { from: 'customer', text: 'Just tried the new Guatemala blend \u2014 incredible! \u{1F525}', time: '15m ago' },
      { from: 'support', text: 'Thanks Alex! So glad you\'re enjoying it! \u2764\uFE0F', time: '12m ago' },
      { from: 'customer', text: 'Do you offer a monthly subscription? I don\'t want to run out again', time: '10m ago' },
      { from: 'support', text: 'We do! Subscribers get 15% off every bag and free shipping. I\'ll send you the signup link \u{1F389}', time: '5m ago' },
    ],
  },
  {
    id: 'taylor',
    initials: 'TS',
    name: 'Taylor Smith',
    channel: 'email',
    address: 'orders@roastco.com',
    gradient: 'from-violet-400 to-fuchsia-600',
    messages: [
      { from: 'customer', text: 'Hi! Just placed order #4892', time: '20m ago' },
      { from: 'support', text: 'Got it Taylor! We\'re packing it up now \u{1F4E6}', time: '18m ago' },
      { from: 'customer', text: 'Can you add a gift note? It\'s for my mom\'s birthday', time: '15m ago' },
      { from: 'support', text: 'Of course! What would you like it to say? \u{1F382}', time: '12m ago' },
      { from: 'customer', text: '"Happy Birthday Mom! Love, Taylor" ', time: '10m ago' },
      { from: 'support', text: 'Perfect, added! She\'s going to love it \u2764\uFE0F', time: '8m ago' },
      { from: 'customer', text: 'Perfect, order received!', time: '5m ago' },
    ],
  },
];

// =============================================================================
// AUTO-REPLY DEMO CONVERSATIONS — Add new auto-reply demos here!
// =============================================================================
export const autoReplyConversations: AutoReplyConversation[] = [
  {
    id: 'marcus',
    initials: 'MR',
    name: 'Marcus Rivera',
    channel: 'email',
    address: 'orders@roastco.com',
    gradient: 'from-violet-500 to-purple-700',
    preview: 'URGENT: Need Ethiopian Yirgacheffe...',
    time: '11:47 PM',
    urgent: true,
    messages: [
      { from: 'customer', text: 'Hey, this is urgent \u2014 we\'re completely out of Ethiopian Yirgacheffe and I open at 6am tomorrow. Can you help?', time: '11:47 PM' },
      { from: 'ai', text: 'Hi Marcus! I can see you\'re a regular \u2014 let me pull up your last order right away. \u{1F50D}', time: '11:47 PM' },
      {
        from: 'ai',
        text: '',
        time: '11:47 PM',
        isOrderCard: true,
        orderDetails: {
          items: [{ name: 'Ethiopian Yirgacheffe (2lb)', qty: 5, price: 18.99 }],
          shipping: 'Rush Delivery',
          shippingCost: 6.99,
          total: 101.94,
          delivery: 'By 5:30 AM',
        },
      },
      { from: 'ai', text: 'I\'ve prepared your usual order with rush shipping. Reply Y to confirm, N to cancel, or type any changes you need!', time: '11:48 PM' },
      { from: 'customer', text: 'Y', time: '11:48 PM' },
      { from: 'ai', text: 'Order #5847 confirmed! \u2705 You\'ll receive shipping confirmation by 6:30 AM. Have a great morning rush, Marcus!', time: '11:48 PM' },
    ],
  },
  {
    id: 'jen',
    initials: 'JL',
    name: 'Jen Liu',
    channel: 'email',
    address: 'hello@roastco.com',
    gradient: 'from-pink-500 to-rose-600',
    preview: 'Do you ship to Canada?',
    time: '10:23 PM',
    messages: [
      { from: 'customer', text: 'Hey! Love your coffee. Do you ship to Canada?', time: '10:23 PM' },
      { from: 'ai', text: 'Thanks for the love, Jen! Yes, we ship to Canada \u{1F1E8}\u{1F1E6} Standard shipping is 7-10 business days. Want me to walk you through ordering?', time: '10:23 PM' },
    ],
  },
  {
    id: 'dave',
    initials: 'DK',
    name: 'Dave Kim',
    channel: 'email',
    address: 'support@roastco.com',
    gradient: 'from-blue-500 to-indigo-600',
    preview: 'Subscription renewal question',
    time: '9:15 PM',
    messages: [
      { from: 'customer', text: 'Hi, I wanted to ask about my subscription renewal date. Can you check?', time: '9:15 PM' },
      { from: 'ai', text: 'Of course, Dave! Your subscription renews on March 15th. Would you like to make any changes before then?', time: '9:15 PM' },
    ],
  },
];
