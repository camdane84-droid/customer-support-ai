export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-slate-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-white">Data Deletion Instructions</h1>

        <div className="space-y-6 text-gray-200">
          <section>
            <p>
              This page explains how to request deletion of your data from InboxForge — whether you are a
              customer who contacted a business through our platform, or a business with an InboxForge account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">What Data We Store</h2>
            <p className="mb-3">We store the following data when you interact with businesses through our platform:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your email address and name (when you email a business or provide them in chat)</li>
              <li>Messages you send to businesses via email or their website chat widget</li>
              <li>Conversation timestamps and metadata</li>
              <li>AI-generated notes a business keeps about your conversations</li>
              <li>Your social platform username or ID, if you contacted a business through a connected social integration</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">How to Request Data Deletion</h2>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold mb-3 text-white">Customers: Contact Us</h3>
              <p className="mb-2">
                Email{' '}
                <a href="mailto:inboxforgeapp@outlook.com" className="text-indigo-400 hover:underline">
                  inboxforgeapp@outlook.com
                </a>{' '}
                with a data deletion request including:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>The email address (or chat name / social username) you used to contact the business</li>
                <li>The business you contacted, if you know it</li>
                <li>A description of what data you want deleted</li>
              </ul>
              <p className="mt-3 text-sm text-gray-400">
                We will process your request within 30 days and confirm once your data has been deleted.
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-white">Businesses: Delete Your Account</h3>
              <p className="mb-2">
                Business owners can delete their account and all associated data (conversations, messages,
                customer profiles, connected addresses, team memberships) directly from the dashboard:
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Log in and go to Settings</li>
                <li>Scroll to the account deletion section</li>
                <li>Confirm deletion — this is permanent and cannot be undone</li>
              </ol>
              <p className="mt-3 text-sm text-gray-400">
                Billing records required for tax and accounting compliance are retained by our payment
                processor (Stripe) as required by law.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">What Gets Deleted</h2>
            <p className="mb-3">When you request data deletion, we will:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Permanently delete all messages you sent through our platform</li>
              <li>Remove your email address, name, and any social platform identifiers from our database</li>
              <li>Delete AI-generated notes and any other personal information we have collected about you</li>
              <li>Remove all conversation metadata associated with you</li>
            </ul>
            <p className="mt-3 text-sm text-gray-400">
              Note: Some anonymized data may be retained for analytics and service improvement purposes,
              but will not be personally identifiable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Social Platform Integrations</h2>
            <p className="mb-3">
              If you contacted a business through a connected social integration (such as Instagram), you can
              additionally revoke the app&apos;s access on that platform — for Instagram: Settings &rarr; Security
              &rarr; Apps and Websites &rarr; Remove. Revoking access prevents future data collection but does not
              automatically delete existing data; submit a deletion request above to remove historical data.
              This process complies with Meta&apos;s Platform Policy requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Processing Time</h2>
            <p>
              We process data deletion requests within 30 days of receipt. You will receive a confirmation
              email once your data has been deleted from our systems.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">Questions?</h2>
            <p>
              If you have questions about data deletion or our data practices, please review our{' '}
              <a href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</a> or contact us at{' '}
              <a href="mailto:inboxforgeapp@outlook.com" className="text-indigo-400 hover:underline">
                inboxforgeapp@outlook.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
