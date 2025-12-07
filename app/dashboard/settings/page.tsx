'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { supabase } from '@/lib/api/supabase';
import { Save, Building, Clock } from 'lucide-react';

export default function SettingsPage() {
  const { business } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [policies, setPolicies] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (business) {
      setBusinessName(business.name || '');
      setBusinessType(business.business_type || '');
      setPolicies(business.policies || '');
    }
  }, [business]);

  async function handleSave() {
    if (!business) return;

    setSaving(true);
    setSaved(false);

    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          name: businessName,
          business_type: businessType,
          policies: policies,
        })
        .eq('id', business.id);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (!business) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your business information and preferences
          </p>
        </div>

        {/* Business Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Building className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Type
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select type...</option>
                <option value="restaurant">Restaurant / Cafe</option>
                <option value="retail">Retail / Shop</option>
                <option value="services">Services</option>
                <option value="ecommerce">E-commerce</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policies & Information
              </label>
              <textarea
                value={policies}
                onChange={(e) => setPolicies(e.target.value)}
                rows={6}
                placeholder="Enter your business policies, return policy, shipping info, etc. This helps the AI provide better responses."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                This information will be used by AI to generate better response suggestions
              </p>
            </div>
          </div>
        </div>

        {/* Account Info (Read-only) */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-gray-900 font-medium">{business.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Subscription Plan</p>
              <p className="text-gray-900 font-medium capitalize">{business.subscription_plan}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Account Created</p>
              <p className="text-gray-900 font-medium">
                {new Date(business.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {saved && <span className="text-green-600">✓ Settings saved!</span>}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
