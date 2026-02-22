import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact & Support | InboxForge',
    description: 'Get help from the InboxForge support team. Find answers to common questions about account & billing, Instagram integration, AI features, and technical issues.',
};

const faqTopics = [
    {
        title: 'Account & Billing',
        gradient: 'from-indigo-500 to-blue-500',
        border: 'border-indigo-200 dark:border-indigo-800',
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        dot: 'text-indigo-600 dark:text-indigo-400',
        items: [
            { q: 'How do I change my subscription plan?', a: 'Go to Dashboard → Settings → Billing to view and change your current plan. Changes take effect at the start of your next billing cycle.' },
            { q: 'How do I update my payment method?', a: 'Navigate to Dashboard → Settings → Billing and click "Update Payment Method" to add a new card or switch payment options.' },
            { q: 'Can I get a refund?', a: 'We offer refunds within 14 days of purchase. Contact our support team with your account email and reason for the request.' },
            { q: 'How do I delete my account?', a: 'Go to Dashboard → Settings → Account and scroll to the "Danger Zone" section. Account deletion is permanent and cannot be undone.' },
        ],
    },
    {
        title: 'Instagram Integration',
        gradient: 'from-pink-500 to-purple-500',
        border: 'border-pink-200 dark:border-pink-800',
        bg: 'bg-pink-50 dark:bg-pink-900/20',
        dot: 'text-pink-600 dark:text-pink-400',
        items: [
            { q: 'How do I connect my Instagram account?', a: 'Go to Dashboard → Settings → Integrations and click "Connect Instagram." You\'ll be redirected to Meta to authorize access to your Instagram Professional account.' },
            { q: 'Why are my Instagram messages not appearing?', a: 'Ensure your Instagram account is a Professional (Business or Creator) account and that you\'ve granted all required permissions during the OAuth flow. Try disconnecting and reconnecting.' },
            { q: 'Does InboxForge support Instagram Story replies?', a: 'Yes, story replies and reactions appear in your inbox as regular conversations. You can respond to them directly from the dashboard.' },
        ],
    },
    {
        title: 'AI Features',
        gradient: 'from-purple-500 to-blue-500',
        border: 'border-purple-200 dark:border-purple-800',
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        dot: 'text-purple-600 dark:text-purple-400',
        items: [
            { q: 'How do AI response suggestions work?', a: 'Our AI analyzes the conversation context and your knowledge base to generate relevant reply suggestions. Click any suggestion to use it as-is or edit it before sending.' },
            { q: 'Can I train the AI on my own data?', a: 'Yes! Add articles, FAQs, and documents to your Knowledge Base (Dashboard → Knowledge). The AI uses this content to generate more accurate, brand-specific responses.' },
            { q: 'How do I turn off AI suggestions?', a: 'Go to Dashboard → Settings → AI Configuration to enable or disable AI features, adjust suggestion frequency, and set tone preferences.' },
        ],
    },
    {
        title: 'Technical Issues',
        gradient: 'from-orange-500 to-amber-500',
        border: 'border-orange-200 dark:border-orange-800',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        dot: 'text-orange-600 dark:text-orange-400',
        items: [
            { q: 'The dashboard is loading slowly — what can I do?', a: 'Try clearing your browser cache, disabling extensions, or switching browsers. If the issue persists, check our status page or contact support.' },
            { q: 'I\'m getting a "session expired" error', a: 'This usually means your authentication token has expired. Sign out, clear your cookies, and sign back in to refresh your session.' },
            { q: 'How do I report a bug?', a: 'Email our support team with a description of the issue, steps to reproduce, your browser/OS info, and screenshots if possible. We\'ll investigate and follow up.' },
            { q: 'Are there any known outages?', a: 'Check our status page for real-time updates on system health. We also send email notifications for any planned maintenance windows.' },
        ],
    },
];

// Build all FAQ items for JSON-LD structured data
const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqTopics.flatMap((topic) =>
        topic.items.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.a,
            },
        }))
    ),
};

export default function ContactPage() {
    const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'inboxforgeapp@outlook.com';
    const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'InboxForge';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
            />
            <div className="max-w-4xl mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Contact & Support
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-slate-300">
                        We're here to help. Get in touch with our support team.
                    </p>
                </div>

                {/* Main Contact Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
                        <h2 className="text-2xl font-bold mb-2">Get Support</h2>
                        <p className="text-indigo-100">
                            Our team typically responds within 24 hours during business days
                        </p>
                    </div>

                    <div className="p-8">
                        {/* Email Support */}
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Email Support
                            </h3>
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                                <p className="text-gray-600 dark:text-slate-300 mb-3">
                                    For general inquiries, technical support, or account assistance:
                                </p>
                                <a
                                    href={`mailto:${supportEmail}`}
                                    className="text-2xl font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                >
                                    {supportEmail}
                                </a>
                            </div>
                        </div>

                        {/* Response Time */}
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                                <div className="flex items-center mb-2">
                                    <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h4 className="font-semibold text-gray-900 dark:text-white">Response Time</h4>
                                </div>
                                <p className="text-gray-700 dark:text-slate-300">
                                    Within 24 hours on business days
                                </p>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center mb-2">
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h4 className="font-semibold text-gray-900 dark:text-white">Business Hours</h4>
                                </div>
                                <p className="text-gray-700 dark:text-slate-300">
                                    Monday - Friday, 9AM - 5PM EST
                                </p>
                            </div>
                        </div>

                        {/* What to Include */}
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 border border-amber-200 dark:border-amber-800">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                When contacting support, please include:
                            </h4>
                            <ul className="space-y-2 text-gray-700 dark:text-slate-300">
                                <li className="flex items-start">
                                    <span className="text-amber-600 dark:text-amber-400 mr-2">•</span>
                                    Your account email address
                                </li>
                                <li className="flex items-start">
                                    <span className="text-amber-600 dark:text-amber-400 mr-2">•</span>
                                    A detailed description of your issue or question
                                </li>
                                <li className="flex items-start">
                                    <span className="text-amber-600 dark:text-amber-400 mr-2">•</span>
                                    Screenshots if applicable
                                </li>
                                <li className="flex items-start">
                                    <span className="text-amber-600 dark:text-amber-400 mr-2">•</span>
                                    Steps to reproduce the issue (for technical problems)
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Common Topics - FAQ Accordions */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Common Support Topics</h2>
                    <div className="space-y-4">
                        {faqTopics.map((topic) => (
                            <details
                                key={topic.title}
                                className={`group rounded-lg border ${topic.border} overflow-hidden`}
                            >
                                <summary className={`flex items-center cursor-pointer p-4 ${topic.bg} select-none`}>
                                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${topic.gradient} mr-3 shrink-0`} />
                                    <h3 className="font-semibold text-gray-900 dark:text-white flex-1">{topic.title}</h3>
                                    <svg
                                        className="w-5 h-5 text-gray-500 dark:text-slate-400 transition-transform group-open:rotate-180"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </summary>
                                <div className="px-4 pb-4 pt-2">
                                    <ul className="space-y-3">
                                        {topic.items.map((item) => (
                                            <li key={item.q}>
                                                <p className={`font-medium text-sm ${topic.dot} mb-1`}>{item.q}</p>
                                                <p className="text-sm text-gray-600 dark:text-slate-400 ml-0">{item.a}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </details>
                        ))}
                    </div>
                </div>

                {/* Additional Resources */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Additional Resources</h2>
                    <div className="space-y-4">
                        <a
                            href="/dashboard/knowledge"
                            className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
                        >
                            <div className="flex items-center">
                                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Knowledge Base & User Guides</h3>
                                    <p className="text-sm text-gray-600 dark:text-slate-400">Learn how to use InboxForge features</p>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </a>

                        <a
                            href="/privacy"
                            className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
                        >
                            <div className="flex items-center">
                                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Privacy Policy</h3>
                                    <p className="text-sm text-gray-600 dark:text-slate-400">How we handle your data</p>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </a>

                        <a
                            href="/terms"
                            className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
                        >
                            <div className="flex items-center">
                                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Terms of Service</h3>
                                    <p className="text-sm text-gray-600 dark:text-slate-400">Our service terms and conditions</p>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </a>
                    </div>
                </div>

                {/* Company Info */}
                <div className="text-center mt-12 text-gray-600 dark:text-slate-400">
                    <p className="mb-2">{companyName}</p>
                    <p className="text-sm">
                        © {new Date().getFullYear()} All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
