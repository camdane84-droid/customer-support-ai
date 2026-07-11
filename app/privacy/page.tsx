export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-white">Privacy Policy</h1>

        <div className="space-y-6 text-gray-200">
          <section>
            <p className="text-sm text-gray-400 mb-4">Last Updated: July 11, 2026</p>

            <p>
              This privacy policy describes how InboxForge (&quot;we&quot;, &quot;our&quot;, or &quot;the Service&quot;)
              collects, uses, and shares information when you use our service. InboxForge is an AI-assisted
              customer support platform: businesses connect their email addresses and website chat, and we help
              them triage and answer customer messages.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Information We Collect</h2>
            <p className="mb-3">We collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Messages and Communications:</strong> When you email a business
                that uses InboxForge, or message them through their website chat, we store the content of those
                messages to provide customer support services.
              </li>
              <li>
                <strong className="text-white">Contact Information:</strong> We collect your email address and
                name (when provided) so the business can identify you and route replies to you. Website chat
                visitors may chat anonymously.
              </li>
              <li>
                <strong className="text-white">Business Account Information:</strong> For businesses using
                InboxForge, we collect account details (name, email, connected addresses), team member accounts,
                and billing information processed by Stripe.
              </li>
              <li>
                <strong className="text-white">Usage Data:</strong> We collect information about how you interact
                with our service, including timestamps and conversation metadata.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">How We Use Your Information</h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide customer support services and facilitate communication between customers and businesses</li>
              <li>Route emails and chat messages to the correct business inbox</li>
              <li>Generate AI-powered features on behalf of the business: message classification (e.g. flagging urgent
                messages), reply suggestions, automatic replies, and customer profile notes</li>
              <li>Send responses to your messages via email or website chat</li>
              <li>Improve our service and develop new features</li>
              <li>Maintain security, enforce usage limits, and prevent abuse of our service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Email Processing</h2>
            <p className="mb-3">
              Businesses connect their email addresses to InboxForge by forwarding mail to a unique address we
              provide. When you email a connected business:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your email address, name, and message content are stored in our database</li>
              <li>The business sees your message in their InboxForge inbox and can reply from there</li>
              <li>Replies are delivered by our email providers with the business&apos;s address as the reply-to</li>
              <li>Message content may be processed by our AI provider to classify the message and draft or send
                replies on the business&apos;s behalf</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Website Chat Widget</h2>
            <p className="mb-3">
              Businesses can embed our chat widget on their own websites. When you use a business&apos;s chat widget:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your messages, and the name/email you optionally provide, are stored in our database</li>
              <li>A session token is stored in your browser&apos;s local storage so your conversation persists between visits</li>
              <li>Replies may come from the business&apos;s team or from an AI assistant acting on their behalf
                (AI replies are labeled as such in the chat)</li>
              <li>We do not track your browsing on the business&apos;s website beyond the chat itself</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Social Media Integrations</h2>
            <p>
              InboxForge may offer integrations with social messaging platforms such as Instagram, WhatsApp, or
              TikTok. Where a business has such an integration connected, your platform username or phone number
              and the messages you send to that business are stored and handled the same way as email messages,
              using each platform&apos;s official messaging APIs. We only access the messages you send to businesses —
              never your other content — and we never use social platform data for advertising. We comply with
              Meta&apos;s Platform Policy and TikTok&apos;s Developer Terms of Service, including deletion of platform
              data upon request or when no longer needed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Data Sharing</h2>
            <p className="mb-3">We share your information in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">With Businesses:</strong> Messages you send are shared with the
                business you&apos;re contacting so they can provide customer support
              </li>
              <li>
                <strong className="text-white">Service Providers:</strong> We use third-party processors including
                Supabase (database and authentication), Vercel (hosting), Anthropic (AI processing), Resend and
                SendGrid (email delivery and receiving), and Stripe (payments for business subscriptions)
              </li>
              <li>
                <strong className="text-white">Legal Requirements:</strong> We may disclose information if required
                by law or to protect our rights
              </li>
            </ul>
            <p className="mt-3">We do not sell your personal data.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Data Retention</h2>
            <p>
              We retain your messages and conversation data for as long as necessary to provide our service.
              Businesses may archive or delete conversations, which will remove the associated messages from
              our active database.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Request access to the personal data we hold about you</li>
              <li>Request correction or deletion of your personal data (see our <a href="/data-deletion" className="text-blue-400 hover:text-blue-300 underline">data deletion page</a>)</li>
              <li>Object to our processing of your personal data</li>
              <li>Stop receiving messages from a business by emailing them directly or closing the chat</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal data
              against unauthorized access, alteration, disclosure, or destruction — including verified ownership
              of connected email addresses, authenticated webhooks, and hashed chat session tokens. However, no
              method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Children&apos;s Privacy</h2>
            <p>
              Our service is not directed to individuals under the age of 13. We do not knowingly collect
              personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes by
              posting the new privacy policy on this page and updating the &quot;Last Updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our data practices, please contact us at{' '}
              <a href="mailto:inboxforgeapp@outlook.com" className="text-blue-400 hover:text-blue-300 underline">
                inboxforgeapp@outlook.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
