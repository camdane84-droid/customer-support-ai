'use client';

import { useState } from 'react';
import { Menu, X, MessageSquare, BookOpen, Settings, LayoutDashboard, TrendingUp, TestTube, Archive, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth';
import { useAuth } from '@/lib/context/AuthContext';
import { useTheme } from '@/lib/context/ThemeContext';
import UsageDisplay from '@/components/ui/UsageDisplay';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inbox', href: '/dashboard/inbox', icon: MessageSquare },
  { name: 'Archives', href: '/dashboard/archives', icon: Archive },
  { name: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp },
  { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: BookOpen },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Test Email', href: '/test-email', icon: TestTube },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, business } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  async function handleLogout() {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Background with subtle geometric pattern */}
      <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 -z-10">
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.4]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
            </pattern>
            <pattern id="dots" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1" fill="#94a3b8" opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Subtle diagonal accent lines */}
        <div className="absolute top-0 right-0 w-1/2 h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-slate-300 to-transparent rotate-[35deg] origin-center"></div>
          <div className="absolute top-40 -right-20 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent rotate-[35deg] origin-center"></div>
          <div className="absolute top-96 -right-20 w-[500px] h-[1px] bg-gradient-to-r from-transparent via-slate-300 to-transparent rotate-[35deg] origin-center"></div>
        </div>

        {/* Corner accent */}
        <div className="absolute bottom-0 left-0 w-96 h-96 pointer-events-none">
          <div className="absolute bottom-20 left-20 w-[400px] h-[1px] bg-gradient-to-r from-slate-300 via-slate-200 to-transparent -rotate-[45deg] origin-left"></div>
          <div className="absolute bottom-32 left-10 w-[300px] h-[1px] bg-gradient-to-r from-slate-200 to-transparent -rotate-[45deg] origin-left"></div>
        </div>
      </div>

      {/* Mobile sidebar backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <nav
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out lg:hidden
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-slate-200 dark:border-slate-700">
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-2 group rounded-lg px-2 py-1.5 -mx-2 transition-all duration-200 hover:bg-white dark:hover:bg-white"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-indigo-600 dark:to-purple-600 rounded-lg flex items-center justify-center shadow-sm transition-all duration-200 group-hover:bg-white dark:group-hover:bg-white">
              <MessageSquare className="w-4 h-4 text-purple-700 dark:text-white transition-colors duration-200 group-hover:text-purple-600 dark:group-hover:text-purple-600" />
            </div>
            <span className="text-base font-semibold text-slate-900 dark:text-white transition-colors duration-200 group-hover:text-purple-600 dark:group-hover:text-purple-600">InboxForge</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="p-2 space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Mobile user section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-indigo-600 dark:to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-purple-700 dark:text-white">
                  {business?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {business?.name || 'User'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {user?.email || ''}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-slate-600 p-1.5"
              aria-label="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar - Supabase style */}
      <nav
        className={`
          hidden lg:flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-200 ease-out z-30
          ${sidebarExpanded ? 'w-52' : 'w-14'}
        `}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-3 border-b border-slate-200 dark:border-slate-700">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 overflow-hidden group cursor-pointer rounded-lg px-2 py-1.5 -mx-2 transition-all duration-200 hover:bg-white dark:hover:bg-white"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-indigo-600 dark:to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm transition-all duration-200 group-hover:bg-white dark:group-hover:bg-white">
              <MessageSquare className="w-4 h-4 text-purple-700 dark:text-white transition-colors duration-200 group-hover:text-purple-600 dark:group-hover:text-purple-600" />
            </div>
            <span
              className={`
                text-base font-semibold text-slate-900 dark:text-white whitespace-nowrap transition-all duration-200 group-hover:text-purple-600 dark:group-hover:text-purple-600
                ${sidebarExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
              `}
            >
              InboxForge
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-hidden">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center h-9 px-2.5 text-sm font-medium rounded-md transition-all duration-150
                  ${isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
                title={!sidebarExpanded ? item.name : undefined}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-slate-700' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span
                  className={`
                    ml-3 whitespace-nowrap transition-all duration-200
                    ${sidebarExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 w-0'}
                  `}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User section at bottom */}
        <div className="p-2 border-t border-slate-200 dark:border-slate-700">
          <div className={`flex items-center ${sidebarExpanded ? 'justify-between' : 'justify-center'} px-2.5 py-2`}>
            <div className="flex items-center space-x-2 min-w-0 overflow-hidden">
              <div className="w-7 h-7 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-indigo-600 dark:to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-purple-700 dark:text-white">
                  {business?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div
                className={`
                  min-w-0 transition-all duration-200
                  ${sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                `}
              >
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {business?.name || 'User'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {user?.email || ''}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`
                text-slate-400 hover:text-slate-600 p-1.5 transition-all duration-200
                ${sidebarExpanded ? 'opacity-100' : 'opacity-0 w-0 p-0'}
              `}
              aria-label="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop top bar - Usage display and dark mode toggle */}
        <div className="hidden lg:flex items-center justify-end gap-4 h-14 px-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
          {business?.id && <UsageDisplay businessId={business.id} compact />}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Top bar (mobile) */}
        <div className="lg:hidden flex items-center justify-between h-14 px-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-slate-500 hover:text-slate-700 p-1"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 group rounded-lg px-2 py-1 transition-all duration-200 hover:bg-white dark:hover:bg-white"
          >
            <div className="w-6 h-6 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-indigo-600 dark:to-purple-600 rounded-md flex items-center justify-center shadow-sm transition-all duration-200 group-hover:bg-white dark:group-hover:bg-white">
              <MessageSquare className="w-3.5 h-3.5 text-purple-700 dark:text-white transition-colors duration-200 group-hover:text-purple-600 dark:group-hover:text-purple-600" />
            </div>
            <span className="text-base font-semibold text-slate-900 dark:text-white transition-colors duration-200 group-hover:text-purple-600 dark:group-hover:text-purple-600">InboxForge</span>
          </Link>
          <button
            onClick={toggleTheme}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
