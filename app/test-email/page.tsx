'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';

export default function TestEmailPage() {
  const { business } = useAuth();
  const [fromEmail, setFromEmail] = useState('customer@test.com');
  const [fromName, setFromName] = useState('Test Customer');
  const [subject, setSubject] = useState('Test Email Subject');
  const [message, setMessage] = useState('This is a test email message from a customer.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function simulateIncomingEmail() {
    if (!business) {
      setResult('❌ No business logged in');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Simulate the webhook payload
      const formData = new FormData();
      formData.append('from', `${fromName} <${fromEmail}>`);
      formData.append('to', business.email);
      formData.append('subject', subject);
      formData.append('text', message);

      const response = await fetch('/api/webhooks/email', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setResult('✅ Email simulated successfully! Check your inbox.');
      } else {
        const error = await response.json();
        setResult(`❌ Error: ${error.error || 'Failed to simulate email'}`);
      }
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Please log in to test email</p>
          <a href="/login" className="text-indigo-600 hover:underline mt-2 inline-block">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            📧 Email Simulator
          </h1>
          <p className="text-sm text-gray-600">
            Simulate incoming emails to test your inbox without needing SendGrid setup
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Your business email:</strong> {business.email}
            </p>
            <p className="text-xs text-indigo-700 mt-1">
              Simulated emails will appear as if sent to this address
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Name
              </label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Customer Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Email
              </label>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="customer@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email subject line"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email message content"
              />
            </div>

            <button
              onClick={simulateIncomingEmail}
              disabled={loading || !fromEmail || !message}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Simulating...' : '📧 Simulate Incoming Email'}
            </button>

            {result && (
              <div className={`p-4 rounded-lg ${
                result.startsWith('✅')
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {result}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-medium text-gray-900 mb-3">Quick Test Scenarios</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                setFromName('Sarah Johnson');
                setFromEmail('sarah@example.com');
                setSubject('Question about your services');
                setMessage('Hi! I was wondering if you offer delivery? Thanks!');
              }}
              className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              📦 Delivery Question
            </button>
            <button
              onClick={() => {
                setFromName('Mike Chen');
                setFromEmail('mike@example.com');
                setSubject('Urgent: Order issue');
                setMessage('I placed an order yesterday but haven\'t received confirmation. Can you help?');
              }}
              className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              🚨 Order Issue
            </button>
            <button
              onClick={() => {
                setFromName('Emma Davis');
                setFromEmail('emma@example.com');
                setSubject('Hours of operation?');
                setMessage('What are your hours today?');
              }}
              className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              🕐 Hours Question
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-900 mb-2">How to Test:</h3>
          <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
            <li>Fill in the form above (or use quick scenarios)</li>
            <li>Click "Simulate Incoming Email"</li>
            <li>Go to your Inbox page</li>
            <li>You should see a new email conversation!</li>
            <li>Reply to test sending emails</li>
          </ol>
        </div>

        {/* Navigation */}
        <div className="mt-6 text-center">
          <Link
            href="/dashboard/inbox"
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Inbox →
          </Link>
        </div>
      </div>
    </div>
  );
}
