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
          <div className="text-gray-500 dark:text-slate-400">Loading knowledge base...</div>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Knowledge Base</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
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
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Item</span>
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Item</h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ question: '', answer: '', category: '' });
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-300"
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
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Add Item
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ question: '', answer: '', category: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:bg-slate-900 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Knowledge Base Items */}
        {items.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No knowledge base items yet
            </h3>
            <p className="text-gray-500 dark:text-slate-400 mb-6">
              Add common questions and answers to help AI provide better responses
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
                className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
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
                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          loadKnowledgeBase(); // Reload to discard changes
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:bg-slate-900 transition-colors"
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
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {item.question}
                          </h3>
                          {item.category && (
                            <span className="px-2 py-1 bg-blue-100 text-indigo-700 text-xs rounded-full">
                              {item.category}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{item.answer}</p>
                        {item.usage_count > 0 && (
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                            Used {item.usage_count} time{item.usage_count !== 1 ? 's' : ''} by AI
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => setEditingId(item.id)}
                          className="p-2 text-gray-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          className="p-2 text-gray-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">💡 Pro Tips</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>Add your most frequently asked questions first</li>
            <li>AI will automatically use this information when generating responses</li>
            <li>Keep answers concise but informative</li>
            <li>Use categories to organize related questions</li>
          </ul>
        </div>

        {/* User Guides Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Guides</h2>
          </div>
          <p className="text-gray-600 dark:text-slate-300 mb-6">
            Learn how to use InboxForge features to provide better customer support
          </p>

          <div className="space-y-4">
            {/* Guide 1: Connecting Instagram */}
            <details className="group bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10 border border-pink-200 dark:border-pink-800 rounded-lg overflow-hidden">
              <summary className="cursor-pointer p-4 font-semibold text-gray-900 dark:text-white hover:bg-pink-100 dark:hover:bg-pink-900/20 transition-colors flex items-center justify-between">
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-pink-600 dark:text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  How to Connect Instagram
                </span>
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="p-4 pt-0 space-y-3 text-gray-700 dark:text-slate-300">
                <p className="font-medium text-gray-900 dark:text-white">Connect your Instagram Business account to receive DMs in InboxForge:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li><strong>Go to Settings</strong> - Navigate to the Settings page from the sidebar</li>
                  <li><strong>Find Instagram Connection</strong> - Scroll to the "Connected Accounts" section</li>
                  <li><strong>Click "Connect"</strong> - Click the Connect button next to Instagram</li>
                  <li><strong>Authorize with Facebook</strong> - You'll be redirected to Facebook to authorize the connection</li>
                  <li><strong>Select Your Page</strong> - Choose the Facebook Page connected to your Instagram Business account</li>
                  <li><strong>Grant Permissions</strong> - Allow InboxForge to access Instagram messages</li>
                  <li><strong>Done!</strong> - You'll be redirected back and your Instagram will be connected</li>
                </ol>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3 mt-3">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Note:</strong> You need an Instagram Business account (not personal) and it must be connected to a Facebook Page.
                  </p>
                </div>
              </div>
            </details>

            {/* Guide 2: Using AI Features */}
            <details className="group bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden">
              <summary className="cursor-pointer p-4 font-semibold text-gray-900 dark:text-white hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors flex items-center justify-between">
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Using AI Response Suggestions
                </span>
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="p-4 pt-0 space-y-3 text-gray-700 dark:text-slate-300">
                <p className="font-medium text-gray-900 dark:text-white">Get AI-powered response suggestions for faster customer support:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li><strong>Open a Conversation</strong> - Click on any conversation in your Inbox</li>
                  <li><strong>Click "Generate AI Response"</strong> - Find the button at the bottom of the message thread</li>
                  <li><strong>Review the Suggestion</strong> - AI will analyze the conversation and your business info to create a response</li>
                  <li><strong>Edit if Needed</strong> - Click "Use This Response" to add it to your message box, then customize as needed</li>
                  <li><strong>Send</strong> - Send the message to your customer</li>
                </ol>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 mt-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    <strong>Pro Tips:</strong>
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside ml-2">
                    <li>Add business policies in Settings to improve AI responses</li>
                    <li>Enable "AI Customer Insights" to automatically learn about customers</li>
                    <li>Use the Knowledge Base to teach AI about common questions</li>
                  </ul>
                </div>
              </div>
            </details>

            {/* Guide 3: Managing Conversations */}
            <details className="group bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/10 dark:to-teal-900/10 border border-green-200 dark:border-green-800 rounded-lg overflow-hidden">
              <summary className="cursor-pointer p-4 font-semibold text-gray-900 dark:text-white hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors flex items-center justify-between">
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Managing Conversations
                </span>
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="p-4 pt-0 space-y-3 text-gray-700 dark:text-slate-300">
                <p className="font-medium text-gray-900 dark:text-white">Efficiently manage customer conversations:</p>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">📥 Inbox Features:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                      <li><strong>Filter by Status</strong> - View Open, Closed, or All conversations</li>
                      <li><strong>Search</strong> - Find conversations by customer name or content</li>
                      <li><strong>Sort</strong> - Conversations are sorted by most recent activity</li>
                      <li><strong>Unread Count</strong> - See how many unread messages in each conversation</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">💬 Conversation Actions:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                      <li><strong>Close Conversation</strong> - Mark resolved conversations as closed</li>
                      <li><strong>Archive</strong> - Move old conversations to archives</li>
                      <li><strong>Add Notes</strong> - Click the notepad icon to add private notes</li>
                      <li><strong>View Customer Profile</strong> - Click customer name to see their info and history</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">✏️ Sending Messages:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                      <li><strong>Type Your Message</strong> - Use the text box at the bottom</li>
                      <li><strong>Use Canned Responses</strong> - Type "/" to insert pre-written responses</li>
                      <li><strong>Get AI Help</strong> - Click "Generate AI Response" for suggestions</li>
                      <li><strong>Send</strong> - Press Enter or click the send button</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3 mt-3">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>Tip:</strong> Conversations update in real-time. You'll see new messages instantly without refreshing!
                  </p>
                </div>
              </div>
            </details>

            {/* Guide 4: Understanding Analytics */}
            <details className="group bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border border-orange-200 dark:border-orange-800 rounded-lg overflow-hidden">
              <summary className="cursor-pointer p-4 font-semibold text-gray-900 dark:text-white hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors flex items-center justify-between">
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Understanding Analytics
                </span>
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="p-4 pt-0 space-y-3 text-gray-700 dark:text-slate-300">
                <p className="font-medium text-gray-900 dark:text-white">Track your customer support performance:</p>

                <div className="space-y-2">
                  <div className="flex items-start">
                    <span className="font-semibold text-gray-900 dark:text-white mr-2">📊 Total Conversations:</span>
                    <span>Total number of customer conversations</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-semibold text-gray-900 dark:text-white mr-2">⏱️ Avg Response Time:</span>
                    <span>How quickly you respond to customers on average</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-semibold text-gray-900 dark:text-white mr-2">✅ Resolution Rate:</span>
                    <span>Percentage of conversations marked as closed/resolved</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-semibold text-gray-900 dark:text-white mr-2">📈 Trends:</span>
                    <span>See how your metrics change over time</span>
                  </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded p-3 mt-3">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <strong>Goal:</strong> Aim for faster response times and higher resolution rates to improve customer satisfaction!
                  </p>
                </div>
              </div>
            </details>
          </div>

          {/* Need More Help */}
          <div className="mt-6 p-4 bg-gradient-to-br from-purple-100 via-indigo-50 to-blue-100 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-900 border border-indigo-200 dark:border-indigo-800 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Need More Help?
            </h3>
            <p className="text-gray-700 dark:text-slate-300 text-sm mb-3">
              Can't find what you're looking for? Our support team is here to help!
            </p>
            <a
              href="/contact"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Support
            </a>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Knowledge Base Item?
              </h3>
              <p className="text-gray-600 dark:text-slate-300 mb-6">
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
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:bg-slate-900 transition-colors font-medium"
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
