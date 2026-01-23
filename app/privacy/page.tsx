export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-white">Privacy Policy</h1>

        <div className="space-y-6 text-gray-200">
          <section>
            <p className="text-sm text-gray-400 mb-4">Last Updated: {new Date().toLocaleDateString()}</p>

            <p>
              This privacy policy describes how our customer support platform ("we", "our", or "the Service")
              collects, uses, and shares information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Information We Collect</h2>
            <p className="mb-3">We collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Messages and Communications:</strong> When you send messages through Instagram, TikTok,
                WhatsApp, or email, we store the content of those messages to provide customer support services.
              </li>
              <li>
                <strong className="text-white">Account Information:</strong> We collect your social media username/ID (Instagram, TikTok,
                WhatsApp), email address, and other identifiers necessary to route messages to the correct business.
              </li>
              <li>
                <strong className="text-white">Usage Data:</strong> We collect information about how you interact with our service,
                including timestamps and conversation metadata.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">How We Use Your Information</h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide customer support services and facilitate communication between customers and businesses</li>
              <li>Improve our service and develop new features</li>
              <li>Send responses to your messages via Instagram Direct Messages, TikTok Direct Messages, WhatsApp, or email</li>
              <li>Generate AI-powered message suggestions to help businesses respond faster</li>
              <li>Maintain security and prevent abuse of our service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Instagram Integration</h2>
            <p className="mb-3">
              Our service integrates with Instagram to enable businesses to receive and respond to customer messages.
              When you message a business on Instagram:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your Instagram username and message content are stored in our database</li>
              <li>The business can see your messages and send responses through our platform</li>
              <li>We use the Instagram Messaging API to send and receive messages on behalf of businesses</li>
              <li>We do not post to Instagram on your behalf or access your Instagram content beyond the messages you send to businesses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">TikTok Integration</h2>
            <p className="mb-3">
              Our service integrates with TikTok to enable businesses to receive and respond to customer messages.
              When you message a business on TikTok:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your TikTok username and message content are stored in our database</li>
              <li>The business can see your messages and send responses through our platform</li>
              <li>We use the TikTok Content Posting API to send and receive messages on behalf of businesses</li>
              <li>We do not post to TikTok on your behalf or access your TikTok content beyond the messages you send to businesses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">WhatsApp Integration</h2>
            <p className="mb-3">
              Our service integrates with WhatsApp to enable businesses to receive and respond to customer messages.
              When you message a business on WhatsApp:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your WhatsApp phone number and message content are stored in our database</li>
              <li>The business can see your messages and send responses through our platform</li>
              <li>We use the WhatsApp Business API to send and receive messages on behalf of businesses</li>
              <li>We do not access your WhatsApp content beyond the messages you send to businesses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Data Sharing</h2>
            <p className="mb-3">We share your information in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">With Businesses:</strong> Messages you send are shared with the business you're
                contacting so they can provide customer support
              </li>
              <li>
                <strong className="text-white">Service Providers:</strong> We use third-party services including Supabase (database),
                SendGrid (email), Anthropic (AI), Meta/Facebook (Instagram and WhatsApp messaging), and TikTok (TikTok messaging)
              </li>
              <li>
                <strong className="text-white">Legal Requirements:</strong> We may disclose information if required by law or to
                protect our rights
              </li>
            </ul>
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
              <li>Request correction or deletion of your personal data</li>
              <li>Object to our processing of your personal data</li>
              <li>Stop receiving messages by blocking the business on the respective platform (Instagram, TikTok, or WhatsApp)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal data
              against unauthorized access, alteration, disclosure, or destruction. However, no method of
              transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Children's Privacy</h2>
            <p>
              Our service is not directed to individuals under the age of 13. We do not knowingly collect
              personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes by
              posting the new privacy policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our data practices, please contact us.
            </p>
          </section>

          <section className="mt-8 pt-8 border-t border-slate-700">
            <h2 className="text-2xl font-semibold mb-3 text-white">Meta Platform Policy Compliance</h2>
            <p className="mb-3">
              This service complies with Meta's Platform Policy. We:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Only use Instagram and WhatsApp data for the purpose of providing customer support messaging services</li>
              <li>Do not use Instagram or WhatsApp data for advertising or marketing purposes</li>
              <li>Protect user data with industry-standard security measures</li>
              <li>Delete user data upon request or when no longer needed for our service</li>
              <li>Comply with all Meta Platform Terms and Developer Policies</li>
            </ul>
          </section>

          <section className="mt-8 pt-8 border-t border-slate-700">
            <h2 className="text-2xl font-semibold mb-3 text-white">TikTok Platform Policy Compliance</h2>
            <p className="mb-3">
              This service complies with TikTok's Developer Terms of Service. We:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Only use TikTok data for the purpose of providing customer support messaging services</li>
              <li>Do not use TikTok data for advertising or marketing purposes</li>
              <li>Protect user data with industry-standard security measures</li>
              <li>Delete user data upon request or when no longer needed for our service</li>
              <li>Comply with all TikTok Platform Terms and Developer Policies</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
