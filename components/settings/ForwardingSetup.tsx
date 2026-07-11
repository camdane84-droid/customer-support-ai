'use client';

import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, CheckCircle, AlertCircle, ExternalLink, Inbox } from 'lucide-react';

export interface GmailConfirmation {
  code: string | null;
  link: string | null;
  sourceEmail: string | null;
  receivedAt: string;
}

interface ForwardingSetupProps {
  email: string;
  forwardingAddress: string;
  forwardingConfirmedAt: string | null;
  gmailConfirmation?: GmailConfirmation | null;
}

/**
 * Step-by-step panel for setting up auto-forwarding from the business's
 * existing mailbox to their unique InboxForge parse address.
 */
export default function ForwardingSetup({
  email,
  forwardingAddress,
  forwardingConfirmedAt,
  gmailConfirmation,
}: ForwardingSetupProps) {
  // Expanded by default until forwarding is proven working
  const [expanded, setExpanded] = useState(!forwardingConfirmedAt);
  const [copied, setCopied] = useState(false);
  const [provider, setProvider] = useState<'gmail' | 'outlook' | 'other'>('gmail');

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(forwardingAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the address is visible to select manually
    }
  }

  const awaitingGmailConfirm = !forwardingConfirmedAt && !!gmailConfirmation;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center space-x-2">
          <Inbox className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Email forwarding
          </span>
          {forwardingConfirmedAt ? (
            <span className="flex items-center space-x-1 text-green-600 text-xs font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Active</span>
            </span>
          ) : awaitingGmailConfirm ? (
            <span className="flex items-center space-x-1 text-amber-600 dark:text-amber-500 text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Action needed in Gmail</span>
            </span>
          ) : (
            <span className="text-xs text-gray-500 dark:text-slate-400">Not set up yet</span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-4">
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Forward mail from <span className="font-medium">{email}</span> to your unique
            InboxForge address and it will appear in your inbox automatically — no DNS changes needed.
          </p>

          {/* The forwarding address */}
          <div className="flex items-center space-x-2">
            <code className="flex-1 px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-indigo-600 dark:text-indigo-400 overflow-x-auto whitespace-nowrap">
              {forwardingAddress}
            </code>
            <button
              onClick={handleCopy}
              className="p-2 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 transition-colors"
              title="Copy forwarding address"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Gmail confirmation callout */}
          {awaitingGmailConfirm && gmailConfirmation && (
            <div className="p-3 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-900/20">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                Google sent a forwarding confirmation — finish the setup in Gmail:
              </p>
              {gmailConfirmation.code && (
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                  Confirmation code:{' '}
                  <code className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded font-semibold tracking-wider">
                    {gmailConfirmation.code}
                  </code>
                </p>
              )}
              {gmailConfirmation.link && (
                <a
                  href={gmailConfirmation.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-sm font-medium text-amber-800 dark:text-amber-300 underline"
                >
                  <span>Or click here to confirm</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                Then in Gmail, select &quot;Forward a copy of incoming mail&quot; and keep Gmail&apos;s copy.
              </p>
            </div>
          )}

          {/* Provider instructions */}
          {!forwardingConfirmedAt && (
            <div>
              <div className="flex items-center space-x-1 mb-2">
                {(['gmail', 'outlook', 'other'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      provider === p
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {p === 'gmail' ? 'Gmail' : p === 'outlook' ? 'Outlook' : 'Other'}
                  </button>
                ))}
              </div>

              <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-600 dark:text-slate-300">
                {provider === 'gmail' && (
                  <>
                    <li>In Gmail, open <span className="font-medium">Settings → See all settings → Forwarding and POP/IMAP</span></li>
                    <li>Click <span className="font-medium">Add a forwarding address</span> and paste the address above</li>
                    <li>Google sends a confirmation — the code will appear here automatically within a minute</li>
                    <li>Enter the code in Gmail, then choose <span className="font-medium">Forward a copy of incoming mail</span> (keep Gmail&apos;s copy)</li>
                  </>
                )}
                {provider === 'outlook' && (
                  <>
                    <li>In Outlook, open <span className="font-medium">Settings → Mail → Forwarding</span></li>
                    <li>Enable forwarding and paste the address above</li>
                    <li>Check <span className="font-medium">Keep a copy of forwarded messages</span></li>
                    <li>Send yourself a test email — this panel turns green when it arrives</li>
                  </>
                )}
                {provider === 'other' && (
                  <>
                    <li>Open your email host&apos;s forwarding settings (often in the domain control panel)</li>
                    <li>Add a forwarding rule from <span className="font-medium">{email}</span> to the address above, keeping a local copy</li>
                    <li>Send yourself a test email — this panel turns green when it arrives</li>
                  </>
                )}
              </ol>
            </div>
          )}

          {forwardingConfirmedAt && (
            <p className="text-sm text-green-600 dark:text-green-500">
              Forwarding is working — messages sent to {email} are flowing into your inbox.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
