'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Building2, Check, ChevronDown, Users } from 'lucide-react';

export function BusinessSwitcher() {
  const { businesses, currentBusiness, switchBusiness } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  if (!currentBusiness) {
    return null;
  }

  // If only one business, just show the name (no dropdown)
  if (businesses.length === 1) {
    return (
      <div className="px-3 py-2 text-sm">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {currentBusiness.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {currentBusiness.member_role}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <div className="flex-1 min-w-0 text-left">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {currentBusiness.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {currentBusiness.member_role}
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
            <div className="py-1">
              {businesses.map((business) => (
                <button
                  key={business.id}
                  onClick={() => {
                    switchBusiness(business.id);
                    setIsOpen(false);
                    // Refresh the page to load data for the new business
                    router.refresh();
                  }}
                  className="w-full px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {business.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {business.member_role}
                    </div>
                  </div>
                  {currentBusiness.id === business.id && (
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-slate-700" />

            {/* Manage Teams Button */}
            <button
              onClick={() => {
                router.push('/dashboard/team');
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300"
            >
              <Users className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <span className="font-medium">Manage Team</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
