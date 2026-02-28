'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { supabase } from '@/lib/api/supabase';
import { Save, Building, Clock, Share2, Mail, MessageCircle, Instagram, Facebook, CheckCircle, FileText, Sparkles, Trash2, AlertTriangle, Star, ShoppingBag, AlertCircle, Ruler, Heart, ChevronDown } from 'lucide-react';
import TikTokIcon from '@/components/icons/TikTokIcon';
import BillingSection from '@/components/ui/BillingSection';
import { useRouter } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';
import SettingsSkeleton from '@/components/skeletons/SettingsSkeleton';

export default function SettingsPage() {
  const { currentBusiness: business, loading: authLoading, user, refreshBusinesses } = useAuth();
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [policies, setPolicies] = useState('');
  const [autoGenerateNotes, setAutoGenerateNotes] = useState(false);
  const [profileCategories, setProfileCategories] = useState({
    allergies: true,
    favorite_category: true,
    past_orders: true,
    issues: true,
    sizes_dimensions: true,
    preferences: true,
    best_times: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bottomSaveVisible, setBottomSaveVisible] = useState(false);
  const [businessTypeOpen, setBusinessTypeOpen] = useState(false);
  const businessTypeRef = useRef<HTMLDivElement>(null);
  const bottomSaveRef = useRef<HTMLDivElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (business) {
      setBusinessName(business.name || '');
      setBusinessType(business.business_type || '');
      setPolicies(business.policies || '');
      setAutoGenerateNotes((business as any).auto_generate_notes || false);
      setProfileCategories((business as any).profile_categories || {
        allergies: true,
        favorite_category: true,
        past_orders: true,
        issues: true,
        sizes_dimensions: true,
        preferences: true,
        best_times: true,
      });
    }
  }, [business]);

  // Close business type dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (businessTypeRef.current && !businessTypeRef.current.contains(e.target as Node)) {
        setBusinessTypeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Track when bottom save button is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setBottomSaveVisible(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    if (bottomSaveRef.current) {
      observer.observe(bottomSaveRef.current);
    }

    return () => observer.disconnect();
  }, []);

  async function handleSave() {
    if (!business) return;

    setSaving(true);
    setSaved(false);

    try {
      console.log('💾 Saving settings...');

      // Try to update with auto_generate_notes and profile_categories
      let { error } = await supabase
        .from('businesses')
        .update({
          name: businessName,
          business_type: businessType,
          policies: policies,
          auto_generate_notes: autoGenerateNotes,
          profile_categories: profileCategories,
        })
        .eq('id', business.id);

      // If column doesn't exist, save without it
      if (error && error.message.includes('auto_generate_notes')) {
        console.warn('⚠️ auto_generate_notes column not found, saving other fields');
        const result = await supabase
          .from('businesses')
          .update({
            name: businessName,
            business_type: businessType,
            policies: policies,
          })
          .eq('id', business.id);

        error = result.error;
      }

      if (error) {
        console.error('❌ Save error:', error);
        throw error;
      }

      console.log('✅ Settings saved successfully');

      // Refresh business data in AuthContext to reflect the changes
      await refreshBusinesses();

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      alert(`Failed to save settings: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!user) return;

    // If business exists, verify confirmation matches business name
    if (business) {
      if (deleteConfirmation !== business.name) {
        alert('Business name does not match. Please type your business name exactly to confirm deletion.');
        return;
      }
    } else {
      // No business - just confirm with user email
      if (deleteConfirmation !== 'DELETE') {
        alert('Please type "DELETE" to confirm account deletion.');
        return;
      }
    }

    setDeleting(true);

    try {
      // Call API to delete account
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: business?.name || '' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete account');
      }

      // Sign out and redirect
      await supabase.auth.signOut();
      router.push('/');
    } catch (error: any) {
      alert(`Failed to delete account: ${error.message}`);
      setDeleting(false);
    }
  }

  // Show loading state only while auth is initializing
  if (authLoading) {
    return (
      <DashboardLayout>
        <SettingsSkeleton />
      </DashboardLayout>
    );
  }

  // Show error state if auth completed but no business found
  if (!business) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <div className="text-gray-500 dark:text-slate-400 text-lg">Unable to load business data</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header with Sticky Save Button */}
        <div className={`sticky top-6 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-lg border border-gray-200 dark:border-slate-700 p-6 transition-opacity duration-200 ${bottomSaveVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Manage your business info and preferences
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {saved && <span className="text-sm text-green-600">✓ Saved!</span>}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Billing & Subscription */}
        <BillingSection
          businessId={business.id}
          currentTier={(business.subscription_tier || 'free') as 'free' | 'starter' | 'pro'}
          stripeCustomerId={business.stripe_customer_id}
        />

        {/* Social Media Connections - Only for owners and admins */}
        {business && hasPermission(business.member_role, 'MANAGE_SOCIAL_CONNECTIONS') && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Share2 className="w-5 h-5 text-gray-500 dark:text-slate-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Connected Accounts</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-300 mb-6">
            Connect your social media accounts to receive messages in your InboxForge inbox
          </p>

          <div className="space-y-4">
            {/* Email Connection (Always Active) */}
            <ConnectionCard
              platform="email"
              icon={Mail}
              name="Email"
              description={business.email}
              isConnected={true}
              canDisconnect={false}
              color="blue"
            />

            {/* Instagram Connection */}
            <InstagramConnection businessId={business.id} />

            {/* Facebook Connection - COMING SOON */}
            {/* <FacebookConnection businessId={business.id} /> */}

            {/* WhatsApp Connection */}
            <WhatsAppConnection businessId={business.id} />

            {/* TikTok Connection */}
            <TikTokConnection businessId={business.id} />
          </div>
        </div>
        )}

        {/* AI Features */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Customer Insights</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-300 mb-6">
            Let AI automatically learn about your customers to improve service quality
          </p>

          <div className="space-y-4">
            {/* AI Insights Toggle */}
            <div className="flex items-start justify-between p-4 border border-gray-200 dark:border-indigo-700/50 rounded-lg hover:border-purple-300 dark:hover:border-indigo-600 transition-colors bg-gradient-to-r from-purple-50 to-blue-50 dark:from-indigo-900/40 dark:to-purple-900/40">
              <div className="flex-1 pr-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-medium text-gray-900 dark:text-white">AI Customer Insights</h3>
                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                    Recommended
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
                  Enable AI to automatically generate customer profiles and conversation notes.
                </p>

                <div className="space-y-2 mb-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 mt-1.5"></div>
                    <p className="text-sm text-gray-700 dark:text-slate-300">
                      <strong>Auto-Notes:</strong> Creates bullet-point summaries in the notepad (e.g., "asked about S coffee price")
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 mt-1.5"></div>
                    <p className="text-sm text-gray-700 dark:text-slate-300">
                      <strong>Customer Profiles:</strong> Extracts preferences, allergies, past orders, and more
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-slate-400 italic">
                  When enabled, AI passively collects relevant information from conversations—such as product preferences, questions, concerns, and order history—to help provide better, more personalized service. All data stays private within your account.
                </p>
              </div>
              <button
                onClick={() => setAutoGenerateNotes(!autoGenerateNotes)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${autoGenerateNotes ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoGenerateNotes ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            {/* Profile Categories - Only show when AI insights are enabled */}
            {autoGenerateNotes && (
              <div className="mt-4 p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900">
                <div className="flex items-center space-x-2 mb-3">
                  <FileText className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                  <h3 className="font-medium text-gray-900 dark:text-white">Customize Profile Categories</h3>
                </div>
                <p className="text-xs text-gray-600 dark:text-slate-400 mb-4">
                  Choose which customer information categories appear in profiles
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Allergies Toggle */}
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-gray-700 dark:text-slate-300">Allergies</span>
                    </div>
                    <button
                      onClick={() => setProfileCategories(prev => ({ ...prev, allergies: !prev.allergies }))}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${profileCategories.allergies ? 'bg-purple-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profileCategories.allergies ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Favorite Category Toggle */}
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="text-sm text-gray-700 dark:text-slate-300">Favorite Category</span>
                    </div>
                    <button
                      onClick={() => setProfileCategories(prev => ({ ...prev, favorite_category: !prev.favorite_category }))}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${profileCategories.favorite_category ? 'bg-purple-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profileCategories.favorite_category ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Past Orders Toggle */}
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center space-x-2">
                      <ShoppingBag className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700 dark:text-slate-300">Past Orders</span>
                    </div>
                    <button
                      onClick={() => setProfileCategories(prev => ({ ...prev, past_orders: !prev.past_orders }))}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${profileCategories.past_orders ? 'bg-purple-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profileCategories.past_orders ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Issues Toggle */}
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-700 dark:text-slate-300">Issues</span>
                    </div>
                    <button
                      onClick={() => setProfileCategories(prev => ({ ...prev, issues: !prev.issues }))}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${profileCategories.issues ? 'bg-purple-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profileCategories.issues ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Sizes/Dimensions Toggle */}
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center space-x-2">
                      <Ruler className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm text-gray-700 dark:text-slate-300">Sizes / Dimensions</span>
                    </div>
                    <button
                      onClick={() => setProfileCategories(prev => ({ ...prev, sizes_dimensions: !prev.sizes_dimensions }))}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${profileCategories.sizes_dimensions ? 'bg-purple-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profileCategories.sizes_dimensions ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Preferences Toggle */}
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-pink-500" />
                      <span className="text-sm text-gray-700 dark:text-slate-300">Preferences</span>
                    </div>
                    <button
                      onClick={() => setProfileCategories(prev => ({ ...prev, preferences: !prev.preferences }))}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${profileCategories.preferences ? 'bg-purple-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profileCategories.preferences ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Best Times Toggle */}
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-teal-500" />
                      <span className="text-sm text-gray-700 dark:text-slate-300">Best Times</span>
                    </div>
                    <button
                      onClick={() => setProfileCategories(prev => ({ ...prev, best_times: !prev.best_times }))}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${profileCategories.best_times ? 'bg-purple-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profileCategories.best_times ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Business Info */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Building className="w-5 h-5 text-gray-500 dark:text-slate-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Business Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Business Type
              </label>
              <div ref={businessTypeRef} className="relative">
                <button
                  type="button"
                  onClick={() => setBusinessTypeOpen(!businessTypeOpen)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white flex items-center justify-between"
                >
                  <span className={businessType ? '' : 'text-gray-400 dark:text-slate-500'}>
                    {businessType
                      ? { restaurant: 'Restaurant / Cafe', retail: 'Retail / Shop', services: 'Services', ecommerce: 'E-commerce', other: 'Other' }[businessType]
                      : 'Select type...'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-slate-500 transition-transform ${businessTypeOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`absolute z-10 mt-1 w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg overflow-hidden transition-all duration-200 origin-top ${
                  businessTypeOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'
                }`}>
                  {[
                    { value: '', label: 'Select type...' },
                    { value: 'restaurant', label: 'Restaurant / Cafe' },
                    { value: 'retail', label: 'Retail / Shop' },
                    { value: 'services', label: 'Services' },
                    { value: 'ecommerce', label: 'E-commerce' },
                    { value: 'other', label: 'Other' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => { setBusinessType(option.value); setBusinessTypeOpen(false); }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                        businessType === option.value
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Policies & Information
              </label>
              <textarea
                value={policies}
                onChange={(e) => setPolicies(e.target.value)}
                rows={6}
                placeholder="Enter your business policies, return policy, shipping info, etc. This helps the AI provide better responses."
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
              />
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                This information will be used by AI to generate better response suggestions
              </p>
            </div>
          </div>
        </div>

        {/* Account Info (Read-only) */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-300">Email</p>
              <p className="text-gray-900 dark:text-white font-medium">{business.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-300">Subscription Plan</p>
              <p className="text-gray-900 dark:text-white font-medium capitalize">{business.subscription_tier || 'free'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-300">Account Created</p>
              <p className="text-gray-900 dark:text-white font-medium">
                {new Date(business.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Help & Support */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Help & Support</h2>
          </div>
          <p className="text-gray-600 dark:text-slate-300 mb-4">
            Need assistance or have questions? Our support team is here to help you get the most out of InboxForge.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Support
            </a>
            <a
              href="/dashboard/knowledge"
              className="inline-flex items-center justify-center px-4 py-2 border border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              View User Guides
            </a>
          </div>
        </div>

        {/* Danger Zone - Delete Account */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-300">Danger Zone</h2>
          </div>
          <p className="text-red-800 dark:text-red-300 mb-4">
            Once you delete your account, there is no going back. This will permanently delete your business data, conversations, and customer information.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </button>
        </div>

        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6 shadow-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Account</h3>
              </div>

              <p className="text-gray-600 dark:text-slate-300 mb-4">
                This action cannot be undone. This will permanently delete:
              </p>

              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-slate-300 mb-4 space-y-1">
                <li>Your business profile</li>
                <li>All conversations and messages</li>
                <li>Customer data and profiles</li>
                <li>Social media connections</li>
                <li>Canned responses</li>
              </ul>

              <p className="text-gray-900 dark:text-white font-medium mb-2">
                {business ? (
                  <>Please type <span className="font-bold text-red-600 dark:text-red-400">{business.name}</span> to confirm:</>
                ) : (
                  <>Please type <span className="font-bold text-red-600 dark:text-red-400">DELETE</span> to confirm:</>
                )}
              </p>

              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={business?.name || 'DELETE'}
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 placeholder:text-red-400 placeholder:opacity-50"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirmation !== (business?.name || 'DELETE')}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div ref={bottomSaveRef} className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-slate-400">
            {saved && <span className="text-green-600">✓ Settings saved!</span>}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Connection Card Component
function ConnectionCard({
  platform,
  icon: Icon,
  name,
  description,
  isConnected,
  canDisconnect,
  color,
  onConnect,
  onDisconnect,
  disabled = false,
}: {
  platform: string;
  icon: any;
  name: string;
  description: string;
  isConnected: boolean;
  canDisconnect: boolean;
  color: 'blue' | 'pink' | 'green' | 'slate';
  onConnect?: () => void;
  onDisconnect?: () => void;
  disabled?: boolean;
}) {
  const colors = {
    blue: 'text-indigo-500 bg-blue-50 dark:bg-transparent dark:border dark:border-slate-700',
    pink: 'text-pink-500 bg-pink-50 dark:bg-transparent dark:border dark:border-slate-700',
    green: 'text-green-500 bg-green-50 dark:bg-transparent dark:border dark:border-slate-700',
    slate: 'text-slate-700 dark:text-slate-400 bg-slate-50 dark:bg-transparent dark:border dark:border-slate-700',
  };

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{name}</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">{description}</p>
        </div>
      </div>

      {disabled ? (
        <span className="px-4 py-2 text-sm text-gray-400 dark:text-slate-500 bg-transparent border border-gray-200 dark:border-slate-700 rounded-lg">
          Coming Soon
        </span>
      ) : isConnected ? (
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-2 text-green-600 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            <span>Connected</span>
          </span>
          {canDisconnect && (
            <button
              onClick={onDisconnect}
              className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={onConnect}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Connect
        </button>
      )}
    </div>
  );
}

// Instagram Connection Component
function InstagramConnection({ businessId }: { businessId: string }) {
  const [connection, setConnection] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnection();
  }, []);

  async function loadConnection() {
    try {
      const { data, error } = await supabase
        .from('social_connections')
        .select('*')
        .eq('business_id', businessId)
        .eq('platform', 'instagram')
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error loading Instagram connection:', error);
      }

      setConnection(data);
    } catch (error) {
      console.error('Failed to load Instagram connection:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleConnect() {
    const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID;

    console.log('🔍 Debug Info:');
    console.log('Meta App ID:', metaAppId);

    if (!metaAppId) {
      alert('Meta App ID not configured! Check your .env.local file.');
      return;
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`;

    // Use Facebook OAuth for Instagram Business/Messaging
    const authUrl =
      `https://www.facebook.com/v21.0/dialog/oauth?` +
      `client_id=${metaAppId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=business_management,pages_show_list,pages_read_engagement,pages_messaging,pages_manage_metadata,instagram_basic,instagram_manage_messages&` +
      `response_type=code&` +
      `state=${businessId}`;

    console.log('🔗 Full OAuth URL:', authUrl);
    console.log('Using Meta App ID:', metaAppId);
    window.location.href = authUrl;
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect Instagram? You will stop receiving Instagram messages.')) return;

    await supabase
      .from('social_connections')
      .update({ is_active: false })
      .eq('id', connection.id);

    setConnection(null);
  }

  // Always show the card, even while loading
  return (
    <ConnectionCard
      platform="instagram"
      icon={Instagram}
      name="Instagram"
      description={connection ? `@${connection.platform_username}` : 'Receive Instagram DMs'}
      isConnected={!!connection}
      canDisconnect={true}
      color="pink"
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
    />
  );
}

// Facebook Connection Component - COMING SOON
/*
function FacebookConnection({ businessId }: { businessId: string }) {
  const [connection, setConnection] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnection();
  }, []);

  async function loadConnection() {
    const { data } = await supabase
      .from('social_connections')
      .select('*')
      .eq('business_id', businessId)
      .eq('platform', 'facebook')
      .eq('is_active', true)
      .single();

    setConnection(data);
    setLoading(false);
  }

  function handleConnect() {
    const redirectUri = `${window.location.origin}/api/auth/facebook/callback`;
    const authUrl =
      `https://www.facebook.com/v21.0/dialog/oauth?` +
      `client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&` +
      `redirect_uri=${redirectUri}&` +
      `scope=pages_messaging,pages_manage_metadata,pages_read_engagement&` +
      `response_type=code&` +
      `state=${businessId}`;

    window.location.href = authUrl;
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect Facebook? You will stop receiving Facebook messages.')) return;

    await supabase
      .from('social_connections')
      .update({ is_active: false })
      .eq('id', connection.id);

    setConnection(null);
  }

  if (loading) return null;

  return (
    <ConnectionCard
      platform="facebook"
      icon={Facebook}
      name="Facebook Messenger"
      description={connection ? connection.platform_username : 'Receive Facebook messages'}
      isConnected={!!connection}
      canDisconnect={true}
      color="blue"
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
    />
  );
}
*/

// WhatsApp Connection Component
function WhatsAppConnection({ businessId }: { businessId: string }) {
  const [connection, setConnection] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnection();
  }, []);

  async function loadConnection() {
    try {
      const { data, error } = await supabase
        .from('social_connections')
        .select('*')
        .eq('business_id', businessId)
        .eq('platform', 'whatsapp')
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error loading WhatsApp connection:', error);
      }

      setConnection(data);
    } catch (error) {
      console.error('Failed to load WhatsApp connection:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleConnect() {
    const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID;

    console.log('🔍 WhatsApp Debug Info:');
    console.log('Meta App ID:', metaAppId);

    if (!metaAppId) {
      alert('Meta App ID not configured! Check your .env.local file.');
      return;
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/whatsapp/callback`;

    // Use Facebook OAuth for WhatsApp Business
    const authUrl =
      `https://www.facebook.com/v21.0/dialog/oauth?` +
      `client_id=${metaAppId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=business_management,whatsapp_business_management,whatsapp_business_messaging&` +
      `response_type=code&` +
      `state=${businessId}`;

    console.log('🔗 Full WhatsApp OAuth URL:', authUrl);
    console.log('Using Meta App ID:', metaAppId);
    window.location.href = authUrl;
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect WhatsApp? You will stop receiving WhatsApp messages.')) return;

    await supabase
      .from('social_connections')
      .update({ is_active: false })
      .eq('id', connection.id);

    setConnection(null);
  }

  // Always show the card, even while loading
  return (
    <ConnectionCard
      platform="whatsapp"
      icon={MessageCircle}
      name="WhatsApp"
      description={connection ? connection.platform_username : 'Receive WhatsApp messages'}
      isConnected={!!connection}
      canDisconnect={true}
      color="green"
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
    />
  );
}

// TikTok Connection Component - COMING SOON (DM API requires special TikTok approval)
function TikTokConnection({ businessId }: { businessId: string }) {
  return (
    <ConnectionCard
      platform="tiktok"
      icon={TikTokIcon}
      name="TikTok"
      description="Receive TikTok DMs"
      isConnected={false}
      canDisconnect={false}
      color="slate"
      disabled={true}
    />
  );
}
