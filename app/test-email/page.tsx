'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';

type Channel = 'email' | 'whatsapp' | 'instagram';

const CHANNEL_CONFIG = {
  email: { label: 'Email', icon: '\u{1F4E7}', color: 'indigo' },
  whatsapp: { label: 'WhatsApp', icon: '\u{1F4AC}', color: 'green' },
  instagram: { label: 'Instagram', icon: '\u{1F4F7}', color: 'pink' },
} as const;

export default function TestMessagePage() {
  const { currentBusiness: business } = useAuth();
  const [channel, setChannel] = useState<Channel>('email');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Email fields
  const [fromEmail, setFromEmail] = useState('customer@test.com');
  const [fromName, setFromName] = useState('Test Customer');
  const [subject, setSubject] = useState('Test Email Subject');

  // WhatsApp fields
  const [waName, setWaName] = useState('Test Customer');
  const [waPhone, setWaPhone] = useState('+15551234567');

  // Instagram fields
  const [igUsername, setIgUsername] = useState('testcustomer');
  const [igId, setIgId] = useState('123456789');

  // Shared
  const [message, setMessage] = useState('This is a test message from a customer.');

  async function simulateMessage() {
    if (!business) {
      setResult('\u274C No business logged in');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const payload: Record<string, string> = {
        channel,
        businessId: business.id,
        message,
      };

      if (channel === 'email') {
        payload.customerName = fromName;
        payload.customerContact = fromEmail;
        payload.subject = subject;
      } else if (channel === 'whatsapp') {
        payload.customerName = waName;
        payload.customerContact = waPhone;
      } else {
        payload.customerName = igUsername;
        payload.customerContact = igId;
      }

      const response = await fetch('/api/test/simulate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setResult(`\u2705 ${CHANNEL_CONFIG[channel].label} message simulated successfully! Check your inbox.`);
      } else {
        const error = await response.json();
        setResult(`\u274C Error: ${error.error || 'Failed to simulate message'}`);
      }
    } catch (error: any) {
      setResult(`\u274C Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-slate-400">Please log in to test messages</p>
          <a href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Message Simulator
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Simulate incoming messages across all channels to test your inbox
          </p>
        </div>

        {/* Channel Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-2 mb-6 flex gap-2">
          {(Object.keys(CHANNEL_CONFIG) as Channel[]).map((ch) => (
            <button
              key={ch}
              onClick={() => { setChannel(ch); setResult(null); }}
              className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                channel === ch
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              {CHANNEL_CONFIG[ch].icon} {CHANNEL_CONFIG[ch].label}
            </button>
          ))}
        </div>

        {/* Channel Info */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 mb-6">
          {channel === 'email' && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Business email:</strong> {business.email}
              </p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                Simulated emails will appear as if sent to this address
              </p>
            </div>
          )}
          {channel === 'whatsapp' && (
            <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-900 dark:text-green-200">
                Simulates an incoming WhatsApp message directly in your inbox.
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                No WhatsApp connection required for simulation.
              </p>
            </div>
          )}
          {channel === 'instagram' && (
            <div className="p-3 bg-pink-50 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800 rounded-lg">
              <p className="text-sm text-pink-900 dark:text-pink-200">
                Simulates an incoming Instagram DM directly in your inbox.
              </p>
              <p className="text-xs text-pink-700 dark:text-pink-300 mt-1">
                No Instagram connection required for simulation.
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            {/* Email-specific fields */}
            {channel === 'email' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Customer Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    From Email
                  </label>
                  <input
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="customer@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email subject line"
                  />
                </div>
              </>
            )}

            {/* WhatsApp-specific fields */}
            {channel === 'whatsapp' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={waName}
                    onChange={(e) => setWaName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Customer Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+15551234567"
                  />
                </div>
              </>
            )}

            {/* Instagram-specific fields */}
            {channel === 'instagram' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Customer Username
                  </label>
                  <input
                    type="text"
                    value={igUsername}
                    onChange={(e) => setIgUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="instagram_username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Instagram User ID
                  </label>
                  <input
                    type="text"
                    value={igId}
                    onChange={(e) => setIgId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123456789"
                  />
                </div>
              </>
            )}

            {/* Shared message field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Message content"
              />
            </div>

            <button
              onClick={simulateMessage}
              disabled={loading || !message}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Simulating...' : `${CHANNEL_CONFIG[channel].icon} Simulate Incoming ${CHANNEL_CONFIG[channel].label} Message`}
            </button>

            {result && (
              <div className={`p-4 rounded-lg ${
                result.startsWith('\u2705')
                  ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                  : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              }`}>
                {result}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Quick Test Scenarios</h3>
          <div className="space-y-2">
            {channel === 'email' && (
              <>
                <button
                  onClick={() => {
                    setFromName('Sarah Johnson');
                    setFromEmail('sarah@example.com');
                    setSubject('Question about your services');
                    setMessage('Hi! I was wondering if you offer delivery? Thanks!');
                  }}
                  className="w-full text-left px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-sm"
                >
                  {'\u{1F4E6}'} Delivery Question
                </button>
                <button
                  onClick={() => {
                    setFromName('Mike Chen');
                    setFromEmail('mike@example.com');
                    setSubject('Urgent: Order issue');
                    setMessage('I placed an order yesterday but haven\'t received confirmation. Can you help?');
                  }}
                  className="w-full text-left px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-sm"
                >
                  {'\u{1F6A8}'} Order Issue
                </button>
                <button
                  onClick={() => {
                    setFromName('Emma Davis');
                    setFromEmail('emma@example.com');
                    setSubject('Hours of operation?');
                    setMessage('What are your hours today?');
                  }}
                  className="w-full text-left px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-sm"
                >
                  {'\u{1F550}'} Hours Question
                </button>
              </>
            )}

            {channel === 'whatsapp' && (
              <>
                <button
                  onClick={() => {
                    setWaName('Maria Garcia');
                    setWaPhone('+15559876543');
                    setMessage('Hi, do you have any availability for this weekend?');
                  }}
                  className="w-full text-left px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-sm"
                >
                  {'\u{1F4C5}'} Availability Inquiry
                </button>
                <button
                  onClick={() => {
                    setWaName('James Wilson');
                    setWaPhone('+15551112222');
                    setMessage('I need to cancel my appointment tomorrow. Is that possible?');
                  }}
                  className="w-full text-left px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-sm"
                >
                  {'\u274C'} Cancellation Request
                </button>
                <button
                  onClick={() => {
                    setWaName('Ana Rodriguez');
                    setWaPhone('+15553334444');
                    setMessage('How much does your premium package cost?');
                  }}
                  className="w-full text-left px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-sm"
                >
                  {'\u{1F4B0}'} Pricing Question
                </button>
              </>
            )}

            {channel === 'instagram' && (
              <>
                <button
                  onClick={() => {
                    setIgUsername('fashionlover22');
                    setIgId('987654321');
                    setMessage('Love your latest post! Do you ship internationally?');
                  }}
                  className="w-full text-left px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-sm"
                >
                  {'\u{1F30D}'} International Shipping
                </button>
                <button
                  onClick={() => {
                    setIgUsername('dealseeker');
                    setIgId('111222333');
                    setMessage('Do you have any discounts or promo codes available?');
                  }}
                  className="w-full text-left px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-sm"
                >
                  {'\u{1F3F7}\uFE0F'} Discount Inquiry
                </button>
                <button
                  onClick={() => {
                    setIgUsername('collab_brand');
                    setIgId('444555666');
                    setMessage('Hey! We\'d love to discuss a potential collaboration. Are you open to partnerships?');
                  }}
                  className="w-full text-left px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-sm"
                >
                  {'\u{1F91D}'} Collaboration Request
                </button>
              </>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2">How to Test:</h3>
          <ol className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1 list-decimal list-inside">
            <li>Select a channel tab above (Email, WhatsApp, or Instagram)</li>
            <li>Fill in the form (or use quick scenarios)</li>
            <li>Click the simulate button</li>
            <li>Go to your Inbox page</li>
            <li>You should see a new conversation for that channel!</li>
          </ol>
        </div>

        {/* Navigation */}
        <div className="mt-6 text-center">
          <Link
            href="/dashboard/inbox"
            className="inline-flex items-center px-6 py-3 bg-gray-900 dark:bg-slate-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-slate-600 transition-colors"
          >
            Go to Inbox →
          </Link>
        </div>
      </div>
    </div>
  );
}
