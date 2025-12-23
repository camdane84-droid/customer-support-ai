export default function ContactPage() {
    const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@inboxforge.com';
    const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'InboxForge';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
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

                {/* Common Topics */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Common Support Topics</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Account & Billing</h3>
                            <p className="text-sm text-gray-600 dark:text-slate-400">
                                Subscription management, payment issues, account settings
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Instagram Integration</h3>
                            <p className="text-sm text-gray-600 dark:text-slate-400">
                                Connection issues, OAuth problems, message delivery
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI Features</h3>
                            <p className="text-sm text-gray-600 dark:text-slate-400">
                                Response suggestions, customer insights, AI configuration
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Technical Issues</h3>
                            <p className="text-sm text-gray-600 dark:text-slate-400">
                                Bugs, errors, performance problems, feature requests
                            </p>
                        </div>
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
