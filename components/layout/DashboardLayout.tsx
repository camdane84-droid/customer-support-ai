'use client';

import { useState } from 'react';
import { Menu, X, MessageSquare, BookOpen, Settings, LayoutDashboard, TrendingUp, TestTube } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth';
import { useAuth } from '@/lib/context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inbox', href: '/dashboard/inbox', icon: MessageSquare },
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
      <div className="fixed inset-0 bg-slate-50 -z-10">
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.4]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#cbd5e1" strokeWidth="0.5"/>
            </pattern>
            <pattern id="dots" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1" fill="#94a3b8" opacity="0.4"/>
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
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:hidden
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-semibold text-slate-900">Relay</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
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
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-white">
                  {business?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {business?.name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email || ''}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-slate-600 p-1.5"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar - Supabase style */}
      <div
        className={`
          hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-200 ease-out z-30
          ${sidebarExpanded ? 'w-52' : 'w-14'}
        `}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-3 border-b border-slate-200">
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span
              className={`
                text-base font-semibold text-slate-900 whitespace-nowrap transition-all duration-200
                ${sidebarExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
              `}
            >
              Relay
            </span>
          </div>
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
        <div className="p-2 border-t border-slate-200">
          <div className={`flex items-center ${sidebarExpanded ? 'justify-between' : 'justify-center'} px-2.5 py-2`}>
            <div className="flex items-center space-x-2 min-w-0 overflow-hidden">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-white">
                  {business?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div
                className={`
                  min-w-0 transition-all duration-200
                  ${sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                `}
              >
                <p className="text-sm font-medium text-slate-900 truncate">
                  {business?.name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">
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
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <div className="lg:hidden flex items-center justify-between h-14 px-4 bg-white/80 backdrop-blur-sm border-b border-slate-200">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-slate-500 hover:text-slate-700 p-1"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-md flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-base font-semibold text-slate-900">Relay</span>
          </div>
          <div className="w-7" />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
