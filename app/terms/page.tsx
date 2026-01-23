export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-white">Terms of Service</h1>

        <div className="space-y-6 text-gray-200">
          <section>
            <p className="text-sm text-gray-400 mb-4">Last Updated: {new Date().toLocaleDateString()}</p>

            <p>
              These Terms of Service govern your use of our customer support messaging platform.
              By using our service, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Service Description</h2>
            <p>
              Our platform provides businesses with tools to manage customer conversations across multiple
              channels including Instagram Direct Messages, TikTok Direct Messages, WhatsApp, and email.
              We facilitate communication between businesses and their customers through a unified inbox.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Use of Service</h2>
            <p className="mb-3">You agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the service only for lawful purposes</li>
              <li>Not spam, harass, or abuse other users</li>
              <li>Not attempt to gain unauthorized access to our systems</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Comply with Meta's Platform Policy and Instagram's Terms of Use</li>
              <li>Comply with TikTok's Developer Terms of Service and Platform Policies</li>
              <li>Comply with WhatsApp Business Policy and Meta's Platform Terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Business Accounts</h2>
            <p className="mb-3">If you are a business using our platform:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are responsible for all messages sent through your account</li>
              <li>You must respond to customer inquiries in a timely and professional manner</li>
              <li>You must comply with applicable consumer protection and privacy laws</li>
              <li>You grant us permission to access your connected social media accounts (Instagram, TikTok, WhatsApp) to send and receive messages on your behalf</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Customer Messages</h2>
            <p>
              When you send a message to a business through our platform, you consent to us storing and
              processing that message to deliver it to the business and facilitate ongoing communication.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Intellectual Property</h2>
            <p>
              The service, including its original content, features, and functionality, is owned by us and
              is protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Limitation of Liability</h2>
            <p>
              We provide the service "as is" without warranties of any kind. We are not liable for any
              indirect, incidental, special, consequential, or punitive damages resulting from your use
              of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the service at any time,
              with or without notice, for conduct that we believe violates these Terms of Service or
              is harmful to other users or our business.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Changes to Terms</h2>
            <p>
              We may modify these terms at any time. We will notify users of any material changes.
              Your continued use of the service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Contact</h2>
            <p>
              If you have questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:hello@inbox-forge.com" className="text-blue-400 hover:text-blue-300 underline">
                hello@inbox-forge.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
