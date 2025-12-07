'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { supabase } from '@/lib/api/supabase';
import { Plus, Edit2, Trash2, Save, X, BookOpen } from 'lucide-react';

interface KnowledgeItem {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  usage_count: number;
}

export default function KnowledgeBasePage() {
  const { business } = useAuth();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
  });

  useEffect(() => {
    console.log('📝 showAddForm changed to:', showAddForm);
  }, [showAddForm]);

  useEffect(() => {
    if (business) {
      loadKnowledgeBase();
    }
  }, [business]);

  async function loadKnowledgeBase() {
    if (!business) return;

    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!business || !formData.question || !formData.answer) return;

    try {
      const { error } = await supabase.from('knowledge_base').insert({
        business_id: business.id,
        question: formData.question,
        answer: formData.answer,
        category: formData.category || null,
      });

      if (error) throw error;

      setFormData({ question: '', answer: '', category: '' });
      setShowAddForm(false);
      loadKnowledgeBase();
    } catch (error) {
      console.error('Failed to add item:', error);
      alert('Failed to add knowledge base item');
    }
  }

  async function handleUpdate(id: string) {
    const item = items.find(i => i.id === id);
    if (!item) return;

    try {
      const { error } = await supabase
        .from('knowledge_base')
        .update({
          question: item.question,
          answer: item.answer,
          category: item.category,
        })
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      loadKnowledgeBase();
    } catch (error) {
      console.error('Failed to update item:', error);
      alert('Failed to update knowledge base item');
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDeleteConfirm(null);
      loadKnowledgeBase();
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete knowledge base item');
    }
  }

  function updateItem(id: string, field: keyof KnowledgeItem, value: string) {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  }

  if (!business || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading knowledge base...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
            <p className="text-sm text-gray-500 mt-1">
              Add common questions and answers to help AI generate better responses
            </p>
          </div>
          <button
            onClick={() => {
              console.log('🔘 Add button clicked!');
              console.log('Current showAddForm:', showAddForm);
              setShowAddForm(true);
              console.log('After setting showAddForm to true');
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Item</span>
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Add New Item</h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ question: '', answer: '', category: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="What are your business hours?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Answer
                </label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  rows={4}
                  placeholder="We're open Monday-Friday 9am-5pm, Saturday 10am-4pm. Closed Sundays."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category (Optional)
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="hours, pricing, policies, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleAdd}
                  disabled={!formData.question || !formData.answer}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Add Item
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ question: '', answer: '', category: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Knowledge Base Items */}
        {items.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No knowledge base items yet
            </h3>
            <p className="text-gray-500 mb-6">
              Add common questions and answers to help AI provide better responses
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Item</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                {editingId === item.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question
                      </label>
                      <input
                        type="text"
                        value={item.question}
                        onChange={(e) => updateItem(item.id, 'question', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Answer
                      </label>
                      <textarea
                        value={item.answer}
                        onChange={(e) => updateItem(item.id, 'answer', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <input
                        type="text"
                        value={item.category || ''}
                        onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleUpdate(item.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          loadKnowledgeBase(); // Reload to discard changes
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {item.question}
                          </h3>
                          {item.category && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {item.category}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{item.answer}</p>
                        {item.usage_count > 0 && (
                          <p className="text-xs text-gray-500 mt-2">
                            Used {item.usage_count} time{item.usage_count !== 1 ? 's' : ''} by AI
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => setEditingId(item.id)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Add your most frequently asked questions first</li>
            <li>AI will automatically use this information when generating responses</li>
            <li>Keep answers concise but informative</li>
            <li>Use categories to organize related questions</li>
          </ul>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Knowledge Base Item?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this item? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
