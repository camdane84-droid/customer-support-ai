export default function DataDeletion() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Data Deletion Instructions</h1>

      <div className="space-y-6 text-gray-700">
        <section>
          <p>
            This page provides information on how to request deletion of your data from our customer
            support platform in compliance with Meta's Platform Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">What Data We Store</h2>
          <p className="mb-3">We store the following data when you interact with businesses through our platform:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your Instagram username and user ID</li>
            <li>Messages you send to businesses</li>
            <li>Conversation timestamps and metadata</li>
            <li>Your email address (if you contact businesses via email)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">How to Request Data Deletion</h2>
          <p className="mb-3">To request deletion of your data, you can:</p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
            <h3 className="text-lg font-semibold mb-3">Option 1: Contact Us Directly</h3>
            <p className="mb-2">Send a data deletion request including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your Instagram username</li>
              <li>Email address (if applicable)</li>
              <li>Description of what data you want deleted</li>
            </ul>
            <p className="mt-3 text-sm text-gray-600">
              We will process your request within 30 days and confirm once your data has been deleted.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Option 2: Revoke App Access</h3>
            <p className="mb-2">You can revoke our app's access to your Instagram data:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Go to Instagram Settings → Security → Apps and Websites</li>
              <li>Find our app in the Active list</li>
              <li>Click Remove to revoke access</li>
            </ol>
            <p className="mt-3 text-sm text-gray-600">
              Note: Revoking access prevents future data collection but does not automatically delete
              existing data. You still need to submit a deletion request to remove historical data.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">What Gets Deleted</h2>
          <p className="mb-3">When you request data deletion, we will:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Permanently delete all messages you sent through our platform</li>
            <li>Remove your Instagram user ID and username from our database</li>
            <li>Delete any personal information we have collected about you</li>
            <li>Remove all conversation metadata associated with your account</li>
          </ul>
          <p className="mt-3 text-sm text-gray-600">
            Note: Some anonymized data may be retained for analytics and service improvement purposes,
            but will not be personally identifiable.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Processing Time</h2>
          <p>
            We process data deletion requests within 30 days of receipt. You will receive a confirmation
            email once your data has been deleted from our systems.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Questions?</h2>
          <p>
            If you have questions about data deletion or our data practices, please review our{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> or contact us.
          </p>
        </section>

        <section className="mt-8 pt-8 border-t border-gray-300">
          <p className="text-sm text-gray-500">
            This data deletion process complies with Meta's Platform Policy requirements for
            Instagram integrations.
          </p>
        </section>
      </div>
    </div>
  );
}
