'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { supabase } from '@/lib/api/supabase';
import { Save, Building, Clock, Share2, Mail, MessageCircle, Instagram, Facebook, CheckCircle } from 'lucide-react';

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

        {/* Social Media Connections */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Share2 className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Connected Accounts</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Connect your social media accounts to receive messages in your Relay inbox
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

            {/* WhatsApp (Coming Soon) */}
            <ConnectionCard
              platform="whatsapp"
              icon={MessageCircle}
              name="WhatsApp"
              description="Coming soon"
              isConnected={false}
              canDisconnect={false}
              color="green"
              disabled={true}
            />
          </div>
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
  color: 'blue' | 'pink' | 'green';
  onConnect?: () => void;
  onDisconnect?: () => void;
  disabled?: boolean;
}) {
  const colors = {
    blue: 'text-blue-500 bg-blue-50',
    pink: 'text-pink-500 bg-pink-50',
    green: 'text-green-500 bg-green-50',
  };

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>

      {disabled ? (
        <span className="px-4 py-2 text-sm text-gray-400 bg-gray-100 rounded-lg">
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
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={onConnect}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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
