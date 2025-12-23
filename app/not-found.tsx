'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Animation */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse">
            404
          </h1>
        </div>

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-white rounded-full shadow-lg">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Dashboard
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-all hover:shadow-md"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Quick Links:</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link href="/dashboard/inbox" className="text-indigo-600 hover:text-indigo-700 hover:underline">
              Inbox
            </Link>
            <Link href="/dashboard/analytics" className="text-indigo-600 hover:text-indigo-700 hover:underline">
              Analytics
            </Link>
            <Link href="/dashboard/settings" className="text-indigo-600 hover:text-indigo-700 hover:underline">
              Settings
            </Link>
            <Link href="/dashboard/knowledge" className="text-indigo-600 hover:text-indigo-700 hover:underline">
              Knowledge Base
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
