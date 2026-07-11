'use client';

import { useState, useEffect } from 'react';
import { Mail, Plus, X, CheckCircle, Clock, Loader2 } from 'lucide-react';
import ForwardingSetup, { GmailConfirmation } from '@/components/settings/ForwardingSetup';

interface EmailConnection {
  id: string;
  platform_user_id: string;
  platform_username: string;
  metadata: { label?: string; gmail_confirmation?: GmailConfirmation } | null;
  is_active: boolean;
  verified: boolean;
  forwarding_address: string | null;
  forwarding_confirmed_at: string | null;
  created_at: string;
}

interface EmailConnectionsProps {
  businessId: string;
  primaryEmail: string;
}

export default function EmailConnections({ businessId, primaryEmail }: EmailConnectionsProps) {
  const [connections, setConnections] = useState<EmailConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Verification state, keyed by connection id
  const [codeInputs, setCodeInputs] = useState<Record<string, string>>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [verifyErrors, setVerifyErrors] = useState<Record<string, string>>({});
  const [resentId, setResentId] = useState<string | null>(null);

  // No hard limit — businesses can connect as many emails as they need

  useEffect(() => {
    loadConnections();
  }, [businessId]);

  // While any connection is waiting on verification or forwarding setup, poll
  // so Gmail confirmations and the first forwarded email show up live.
  const waitingOnSetup = connections.some(c => !c.verified || !c.forwarding_confirmed_at);
  useEffect(() => {
    if (!waitingOnSetup) return;
    const interval = setInterval(loadConnections, 8000);
    return () => clearInterval(interval);
  }, [waitingOnSetup, businessId]);

  async function loadConnections() {
    try {
      const res = await fetch(`/api/email-connections?businessId=${businessId}`);
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
      }
    } catch (err) {
      console.error('Failed to load email connections:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newEmail.trim()) return;
    setAdding(true);
    setError('');

    try {
      const res = await fetch(`/api/email-connections?businessId=${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail.trim(),
          label: newLabel.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to add email');
        return;
      }

      await loadConnections();
      setNewEmail('');
      setNewLabel('');
      setShowAddForm(false);
    } catch (err) {
      setError('Failed to add email connection');
    } finally {
      setAdding(false);
    }
  }

  async function handleVerify(connectionId: string) {
    const code = (codeInputs[connectionId] || '').trim();
    if (!code) return;
    setVerifyingId(connectionId);
    setVerifyErrors(prev => ({ ...prev, [connectionId]: '' }));

    try {
      const res = await fetch(`/api/email-connections/verify?businessId=${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setVerifyErrors(prev => ({ ...prev, [connectionId]: data.error || 'Verification failed' }));
        return;
      }

      setCodeInputs(prev => ({ ...prev, [connectionId]: '' }));
      await loadConnections();
    } catch (err) {
      setVerifyErrors(prev => ({ ...prev, [connectionId]: 'Verification failed' }));
    } finally {
      setVerifyingId(null);
    }
  }

  async function handleResend(connectionId: string) {
    setResendingId(connectionId);
    setVerifyErrors(prev => ({ ...prev, [connectionId]: '' }));
    setResentId(null);

    try {
      const res = await fetch(`/api/email-connections/verify?businessId=${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId, resend: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        setVerifyErrors(prev => ({ ...prev, [connectionId]: data.error || 'Failed to resend code' }));
        return;
      }

      setResentId(connectionId);
    } catch (err) {
      setVerifyErrors(prev => ({ ...prev, [connectionId]: 'Failed to resend code' }));
    } finally {
      setResendingId(null);
    }
  }

  async function handleRemove(connectionId: string) {
    if (!confirm('Disconnect this email address? You will stop receiving messages sent to it.')) return;
    setRemovingId(connectionId);

    try {
      const res = await fetch(
        `/api/email-connections?businessId=${businessId}&connectionId=${connectionId}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        setConnections(prev => prev.filter(c => c.id !== connectionId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove email');
      }
    } catch (err) {
      alert('Failed to remove email connection');
    } finally {
      setRemovingId(null);
    }
  }

  // Primary email first, then the rest in creation order
  const isPrimary = (c: EmailConnection) =>
    c.platform_user_id.toLowerCase() === primaryEmail.toLowerCase();
  const sortedConnections = [...connections].sort((a, b) =>
    Number(isPrimary(b)) - Number(isPrimary(a))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-3">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Email connection cards */}
      {sortedConnections.map(conn => (
        <div key={conn.id} className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg text-indigo-500 bg-blue-50 dark:bg-transparent dark:border dark:border-slate-700">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {conn.metadata?.label || 'Email'}
                  </p>
                  {isPrimary(conn) && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full">
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400">{conn.platform_user_id}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {conn.verified ? (
                <span className="flex items-center space-x-2 text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  <span>Connected</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2 text-amber-600 dark:text-amber-500 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  <span>Pending verification</span>
                </span>
              )}
              {!isPrimary(conn) && (
                <button
                  onClick={() => handleRemove(conn.id)}
                  disabled={removingId === conn.id}
                  className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  {removingId === conn.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Disconnect'
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Verification form for pending connections */}
          {!conn.verified && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
              <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
                We sent a 6-digit code to <span className="font-medium">{conn.platform_user_id}</span>.
                Enter it below to confirm you own this address.
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={codeInputs[conn.id] || ''}
                  onChange={e => setCodeInputs(prev => ({ ...prev, [conn.id]: e.target.value.replace(/\D/g, '') }))}
                  placeholder="123456"
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => handleVerify(conn.id)}
                  disabled={verifyingId === conn.id || (codeInputs[conn.id] || '').length !== 6}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center space-x-2"
                >
                  {verifyingId === conn.id && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Verify</span>
                </button>
                <button
                  onClick={() => handleResend(conn.id)}
                  disabled={resendingId === conn.id}
                  className="px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
                >
                  {resendingId === conn.id ? 'Sending…' : resentId === conn.id ? 'Code sent!' : 'Resend code'}
                </button>
              </div>
              {verifyErrors[conn.id] && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{verifyErrors[conn.id]}</p>
              )}
              <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                Tip: if this mailbox is on Gmail, setting up forwarding below verifies it automatically.
              </p>
            </div>
          )}

          {/* Forwarding setup */}
          {conn.forwarding_address && (
            <ForwardingSetup
              email={conn.platform_user_id}
              forwardingAddress={conn.forwarding_address}
              forwardingConfirmedAt={conn.forwarding_confirmed_at}
              gmailConfirmation={conn.metadata?.gmail_confirmation || null}
            />
          )}
        </div>
      ))}

      {/* Add Email Form */}
      {showAddForm ? (
        <div className="p-4 border border-indigo-200 dark:border-indigo-700/50 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Add Email Address</h4>
            <button
              onClick={() => { setShowAddForm(false); setError(''); setNewEmail(''); setNewLabel(''); }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="sales@yourbusiness.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="Label (e.g. Sales, Support, Returns)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <p className="text-xs text-gray-500 dark:text-slate-400">
              We&apos;ll email a 6-digit code to this address to confirm you own it.
            </p>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex items-center space-x-2">
              <button
                onClick={handleAdd}
                disabled={adding || !newEmail.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center space-x-2"
              >
                {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Add Email</span>
              </button>
              <button
                onClick={() => { setShowAddForm(false); setError(''); }}
                className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg text-gray-500 dark:text-slate-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-medium">Add Email Address</span>
        </button>
      )}
    </div>
  );
}
