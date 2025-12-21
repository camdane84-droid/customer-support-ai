'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/context/AuthContext';
import Toast from '@/components/ui/Toast';

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  shortcut: string | null;
  category: string | null;
  usage_count: number;
}

export default function CannedResponsesPage() {
  const { business } = useAuth();
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    shortcut: '',
    category: '',
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (business) {
      loadResponses();
    }
  }, [business]);

  async function loadResponses() {
    try {
      const response = await fetch(`/api/canned-responses?businessId=${business?.id}`);
      if (!response.ok) throw new Error('Failed to load responses');
      const data = await response.json();
      setResponses(data.responses || []);
    } catch (error) {
      console.error('Failed to load canned responses:', error);
      setToast({ type: 'error', message: 'Failed to load responses' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!formData.title || !formData.content) {
      setToast({ type: 'error', message: 'Title and content are required' });
      return;
    }

    try {
      const url = editingId
        ? `/api/canned-responses/${editingId}`
        : '/api/canned-responses';

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          business_id: business?.id,
          shortcut: formData.shortcut || null,
          category: formData.category || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to save response');

      setToast({
        type: 'success',
        message: editingId ? 'Response updated!' : 'Response created!'
      });

      setEditingId(null);
      setCreatingNew(false);
      setFormData({ title: '', content: '', shortcut: '', category: '' });
      loadResponses();
    } catch (error) {
      console.error('Failed to save:', error);
      setToast({ type: 'error', message: 'Failed to save response' });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this canned response?')) return;

    try {
      const response = await fetch(`/api/canned-responses/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete response');

      setToast({ type: 'success', message: 'Response deleted!' });
      loadResponses();
    } catch (error) {
      console.error('Failed to delete:', error);
      setToast({ type: 'error', message: 'Failed to delete response' });
    }
  }

  function startEdit(response: CannedResponse) {
    setEditingId(response.id);
    setFormData({
      title: response.title,
      content: response.content,
      shortcut: response.shortcut || '',
      category: response.category || '',
    });
    setCreatingNew(false);
  }

  function startCreate() {
    setCreatingNew(true);
    setEditingId(null);
    setFormData({ title: '', content: '', shortcut: '', category: '' });
  }

  function cancelEdit() {
    setEditingId(null);
    setCreatingNew(false);
    setFormData({ title: '', content: '', shortcut: '', category: '' });
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Canned Responses</h1>
            <p className="text-sm text-gray-500 mt-1">
              Create quick reply templates to save time
            </p>
          </div>
          <button
            onClick={startCreate}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Response</span>
          </button>
        </div>

        {/* Create/Edit Form */}
        {(creatingNew || editingId) && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? 'Edit Response' : 'New Response'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Order Confirmation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Type your response template here..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shortcut (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.shortcut}
                    onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                    placeholder="e.g., /order"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Orders"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={cancelEdit}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Responses List */}
        <div className="space-y-3">
          {responses.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No canned responses yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first quick reply template</p>
            </div>
          ) : (
            responses.map((response) => (
              <div
                key={response.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{response.title}</h3>
                      {response.shortcut && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-mono rounded">
                          {response.shortcut}
                        </span>
                      )}
                      {response.category && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {response.category}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{response.content}</p>
                    <p className="text-xs text-gray-400 mt-2">Used {response.usage_count} times</p>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => startEdit(response)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(response.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </DashboardLayout>
  );
}
