'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Instagram,
  Phone,
  ShoppingBag,
  AlertCircle,
  Ruler,
  Heart,
  AlertTriangle,
  Clock,
  Star,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface CustomerProfile {
  past_orders: Array<{
    product: string;
    date?: string;
    quantity?: number;
  }>;
  issues: string[];
  sizes_dimensions: Record<string, string>;
  preferences: string[];
  allergies: string[];
  best_times: string[];
  favorite_category?: string;
  needs_more_data: string[];
}

interface CustomerProfileModalProps {
  conversationId: string;
  customerName: string;
  customerEmail?: string | null;
  customerInstagram?: string | null;
  aiInsightsEnabled?: boolean;
  profileCategories?: {
    allergies: boolean;
    favorite_category: boolean;
    past_orders: boolean;
    issues: boolean;
    sizes_dimensions: boolean;
    preferences: boolean;
    best_times: boolean;
  };
  onClose: () => void;
}

export default function CustomerProfileModal({
  conversationId,
  customerName,
  customerEmail,
  customerInstagram,
  aiInsightsEnabled = true,
  profileCategories = {
    allergies: true,
    favorite_category: true,
    past_orders: true,
    issues: true,
    sizes_dimensions: true,
    preferences: true,
    best_times: true,
  },
  onClose
}: CustomerProfileModalProps) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [conversationId]);

  async function loadProfile() {
    setLoading(true);
    try {
      const response = await fetch(`/api/customers/${conversationId}/profile`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Profile API error:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to load profile');
      }

      const data = await response.json();
      console.log('Profile loaded:', data);
      setProfile(data.profile);
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      // Set a default empty profile so UI doesn't break
      setProfile({
        past_orders: [],
        issues: [],
        sizes_dimensions: {},
        preferences: [],
        allergies: [],
        best_times: [],
        needs_more_data: ['past_orders', 'issues', 'sizes_dimensions', 'preferences', 'allergies', 'best_times', 'favorite_category']
      });
    } finally {
      setLoading(false);
    }
  }

  async function analyzeProfile() {
    setAnalyzing(true);
    await loadProfile();
    setAnalyzing(false);
  }

  const getInitials = () => {
    return customerName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const InfoSection = ({
    icon: Icon,
    title,
    items,
    emptyMessage,
    color = 'blue',
    inverse = false
  }: {
    icon: any;
    title: string;
    items: string[] | Record<string, string>;
    emptyMessage: string;
    color?: string;
    inverse?: boolean;
  }) => {
    const isEmpty = Array.isArray(items) ? items.length === 0 : Object.keys(items).length === 0;
    const needsData = profile?.needs_more_data.includes(title.toLowerCase().replace(/[\/\s]/g, '_'));

    const colorClasses = inverse ? {
      blue: { bg: 'bg-indigo-600', border: 'border-blue-700', icon: 'text-white', text: 'text-white', iconBg: 'bg-indigo-700' },
      green: { bg: 'bg-green-600', border: 'border-green-700', icon: 'text-white', text: 'text-white', iconBg: 'bg-green-700' },
      orange: { bg: 'bg-orange-600', border: 'border-orange-700', icon: 'text-white', text: 'text-white', iconBg: 'bg-orange-700' },
      red: { bg: 'bg-red-600', border: 'border-red-700', icon: 'text-white', text: 'text-white', iconBg: 'bg-red-700' },
      purple: { bg: 'bg-purple-600', border: 'border-purple-700', icon: 'text-white', text: 'text-white', iconBg: 'bg-purple-700' },
      pink: { bg: 'bg-pink-600', border: 'border-pink-700', icon: 'text-white', text: 'text-white', iconBg: 'bg-pink-700' },
      indigo: { bg: 'bg-indigo-600', border: 'border-indigo-700', icon: 'text-white', text: 'text-white', iconBg: 'bg-indigo-700' },
      teal: { bg: 'bg-teal-600', border: 'border-teal-700', icon: 'text-white', text: 'text-white', iconBg: 'bg-teal-700' },
    }[color] || { bg: 'bg-indigo-600', border: 'border-blue-700', icon: 'text-white', text: 'text-white', iconBg: 'bg-indigo-700' } : {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-indigo-600', text: 'text-blue-900', iconBg: 'bg-white' },
      green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', text: 'text-green-900', iconBg: 'bg-white' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600', text: 'text-orange-900', iconBg: 'bg-white' },
      red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', text: 'text-red-900', iconBg: 'bg-white' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', text: 'text-purple-900', iconBg: 'bg-white' },
      pink: { bg: 'bg-pink-50', border: 'border-pink-200', icon: 'text-pink-600', text: 'text-pink-900', iconBg: 'bg-white' },
      indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-600', text: 'text-indigo-900', iconBg: 'bg-white' },
      teal: { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'text-teal-600', text: 'text-teal-900', iconBg: 'bg-white' },
    }[color] || { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-indigo-600', text: 'text-blue-900', iconBg: 'bg-white' };

    return (
      <div className={`${colorClasses.bg} border ${colorClasses.border} rounded-lg p-4 mb-3 ${inverse ? 'shadow-lg' : ''}`}>
        <div className="flex items-center space-x-2 mb-3">
          <div className={`p-2 rounded-lg ${colorClasses.iconBg} border ${colorClasses.border} shadow-sm`}>
            <Icon className={`w-5 h-5 ${colorClasses.icon}`} />
          </div>
          <h3 className={`text-sm font-bold ${colorClasses.text}`}>{title}</h3>
        </div>
        {isEmpty || needsData ? (
          <div className={`flex items-center space-x-2 text-xs italic pl-2 ${inverse ? 'text-white opacity-70' : 'text-gray-400'}`}>
            <AlertCircle className="w-3 h-3" />
            <span>{needsData ? 'Needs more data' : emptyMessage}</span>
          </div>
        ) : Array.isArray(items) ? (
          <ul className="space-y-2 pl-2">
            {items.map((item, idx) => (
              <li key={idx} className={`text-sm ${colorClasses.text} flex items-start space-x-2`}>
                <span className={`${colorClasses.icon} font-bold mt-0.5`}>•</span>
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-2 pl-2">
            {Object.entries(items).map(([key, value]) => (
              <div key={key} className={`text-sm ${colorClasses.text}`}>
                <span className="font-semibold capitalize">{key}:</span> {value}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Mobile Contact Style */}
        <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 p-6">
          <div className="flex justify-end mb-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mb-3">
              <span className="text-3xl font-bold text-white">{getInitials()}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{customerName}</h2>

            {/* Contact Info */}
            <div className="space-y-1 text-center">
              {customerEmail && (
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{customerEmail}</span>
                </div>
              )}
              {customerInstagram && (
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Instagram className="w-4 h-4" />
                  <span>{customerInstagram}</span>
                </div>
              )}
              {!customerEmail && !customerInstagram && (
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 italic">
                  <AlertCircle className="w-3 h-3" />
                  <span>No contact info</span>
                </div>
              )}
            </div>

            {/* Refresh Button - Only show if AI insights are enabled */}
            {aiInsightsEnabled && (
              <button
                onClick={analyzeProfile}
                disabled={analyzing}
                className="mt-4 flex items-center space-x-2 px-4 py-2 bg-blue-50 text-indigo-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 text-sm"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh Profile</span>
                  </>
                )}
              </button>
            )}

            {/* Show message when AI insights are disabled */}
            {!aiInsightsEnabled && (
              <div className="mt-4 text-xs text-gray-500 italic text-center">
                Enable AI Customer Insights in Settings to analyze this profile
              </div>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : profile ? (
            <>
              {/* Allergies - TOP PRIORITY */}
              {profileCategories.allergies && (
                <InfoSection
                  icon={AlertTriangle}
                  title="Allergies / Restrictions"
                  items={profile.allergies}
                  emptyMessage="No allergies noted"
                  color="red"
                  inverse={true}
                />
              )}

              {/* Favorite Category */}
              {profileCategories.favorite_category && profile.favorite_category && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg p-4 mb-4 shadow-md">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="p-2 rounded-lg bg-white border-2 border-amber-300 shadow-sm">
                      <Star className="w-6 h-6 text-amber-500 fill-amber-400" />
                    </div>
                    <h3 className="text-base font-bold text-amber-900">Favorite Category</h3>
                  </div>
                  <p className="text-lg font-bold text-amber-800 pl-2">{profile.favorite_category}</p>
                </div>
              )}

              {/* Past Orders */}
              {profileCategories.past_orders && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="p-2 rounded-lg bg-white border border-green-200 shadow-sm">
                    <ShoppingBag className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-sm font-bold text-green-900">Past Orders</h3>
                </div>
                {profile.past_orders.length === 0 ? (
                  <div className="flex items-center space-x-2 text-xs text-gray-400 italic pl-2">
                    <AlertCircle className="w-3 h-3" />
                    <span>Needs more data</span>
                  </div>
                ) : (
                  <ul className="space-y-3 pl-2">
                    {profile.past_orders.map((order, idx) => (
                      <li key={idx} className="text-sm text-green-900">
                        <div className="font-bold flex items-center space-x-2">
                          <span className="text-green-600">•</span>
                          <span>{order.product}</span>
                        </div>
                        {(order.date || order.quantity) && (
                          <div className="text-xs text-green-700 ml-4 mt-1">
                            {order.quantity && `Qty: ${order.quantity}`}
                            {order.quantity && order.date && ' • '}
                            {order.date}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              )}

              {profileCategories.issues && (
                <InfoSection
                  icon={AlertCircle}
                  title="Issues"
                  items={profile.issues}
                  emptyMessage="No issues reported"
                  color="orange"
                />
              )}

              {profileCategories.sizes_dimensions && (
                <InfoSection
                  icon={Ruler}
                  title="Sizes / Dimensions"
                  items={profile.sizes_dimensions}
                  emptyMessage="No size information"
                  color="indigo"
                />
              )}

              {profileCategories.preferences && (
                <InfoSection
                  icon={Heart}
                  title="Preferences"
                  items={profile.preferences}
                  emptyMessage="No preferences noted"
                  color="pink"
                />
              )}

              {profileCategories.best_times && (
                <InfoSection
                  icon={Clock}
                  title="Best Times"
                  items={profile.best_times}
                  emptyMessage="No time preferences"
                  color="teal"
                />
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Failed to load profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
