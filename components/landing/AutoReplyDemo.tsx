'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  Clock,
  Moon,
  Zap,
  Check,
  Package,
} from 'lucide-react';
import {
  autoReplyConversations,
  channelConfig,
} from './demo-data';

interface AutoReplyDemoProps {
  currentTheme: string;
  loading: boolean;
  user: unknown;
}

export default function AutoReplyDemo({ currentTheme, loading, user }: AutoReplyDemoProps) {
  const autoReplyRef = useRef<HTMLDivElement>(null);
  const [isAutoReplyVisible, setIsAutoReplyVisible] = useState(false);
  const [autoReplySelectedId, setAutoReplySelectedId] = useState('marcus');

  useEffect(() => {
    if (loading || user) return;
    const currentRef = autoReplyRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsAutoReplyVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.15, rootMargin: '100px' }
    );

    observer.observe(currentRef);
    return () => observer.unobserve(currentRef);
  }, [loading, user]);

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 border-b border-purple-200 dark:border-purple-400/30 overflow-hidden">
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.08)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/20 border border-primary/30 text-primary text-sm mb-6 shadow-sm">
            <Moon className="w-4 h-4" />
            <span className="font-semibold">Never Miss a Customer</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            AI That Works While You Sleep
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            An urgent email at 11:47 PM? AI auto-reply answers it instantly — pulling up order history, preparing the order, and confirming delivery before you wake up.
          </p>
        </div>

        {/* Auto-Reply Demo Window */}
        <div
          ref={autoReplyRef}
          className={`rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 overflow-hidden shadow-2xl relative ${isAutoReplyVisible ? 'autoreply-visible' : ''}`}
        >
          <div className="flex" style={{ minHeight: '480px' }}>
            {/* Fixed Sidebar */}
            <div className={`w-[200px] flex-shrink-0 border-r flex-col hidden sm:flex ${
              currentTheme === 'dark'
                ? 'bg-[#0f1621] border-slate-700'
                : 'bg-gray-50 border-gray-200'
            }`}>
              {/* Sidebar Header */}
              <div className={`p-4 border-b ${
                currentTheme === 'dark' ? 'border-slate-700' : 'border-gray-200'
              }`}>
                <h2 className={`font-semibold text-sm flex items-center gap-2 ${
                  currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Inbox
                </h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                  </span>
                  <span className="text-[10px] text-primary font-medium">Auto-Reply Active</span>
                </div>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-hidden">
                <div className="p-2 space-y-1">
                  {autoReplyConversations.map((convo) => {
                    const channel = channelConfig[convo.channel];
                    const isSelected = autoReplySelectedId === convo.id;

                    return (
                      <div
                        key={convo.id}
                        onClick={() => setAutoReplySelectedId(convo.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ar-animate-slide-up ar-delay-1 ${
                          isSelected
                            ? currentTheme === 'dark'
                              ? 'bg-slate-800/50 border border-primary/20'
                              : 'bg-white border border-gray-200 shadow-sm'
                            : currentTheme === 'dark'
                              ? 'hover:bg-slate-800/30'
                              : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${convo.gradient} flex items-center justify-center text-white text-[10px] font-bold`}>
                            {convo.initials}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${channel.badgeColor} flex items-center justify-center border-2 ${
                            currentTheme === 'dark' ? 'border-[#0f1621]' : 'border-gray-50'
                          }`}>
                            <span className="w-2 h-2 text-white flex items-center justify-center [&>svg]:w-2 [&>svg]:h-2">
                              {channel.icon}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs truncate font-medium ${
                              currentTheme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                            }`}>{convo.name}</span>
                          </div>
                          <p className={`text-[10px] truncate ${
                            currentTheme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                          }`}>{convo.preview}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`text-[9px] ${
                            currentTheme === 'dark' ? 'text-slate-500' : 'text-gray-400'
                          }`}>{convo.time}</span>
                          {convo.urgent && (
                            <span className="w-2 h-2 rounded-full bg-purple-500 ar-after-hours-badge"></span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${
              currentTheme === 'dark' ? 'bg-[#1a2332]' : 'bg-white'
            }`}>
              {(() => {
                const selectedConvo = autoReplyConversations.find(c => c.id === autoReplySelectedId) || autoReplyConversations[0];
                const channel = channelConfig[selectedConvo.channel];
                const channelName = selectedConvo.channel.charAt(0).toUpperCase() + selectedConvo.channel.slice(1);
                const isMarcusDemo = autoReplySelectedId === 'marcus';

                return (
                  <>
                    {/* Chat Header */}
                    <div className={`h-14 border-b flex items-center justify-between px-4 sm:px-6 ar-animate-slide-up ar-delay-1 ${
                      currentTheme === 'dark'
                        ? 'bg-[#0f1621] border-slate-700'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${selectedConvo.gradient} flex items-center justify-center text-white text-xs font-bold`}>
                          {selectedConvo.initials}
                        </div>
                        <div>
                          <h3 className={`text-sm font-semibold ${
                            currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>{selectedConvo.name}</h3>
                          <p className={`text-xs flex items-center gap-1 ${
                            currentTheme === 'dark' ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            <span className={channel.iconColor}>{channel.icon}</span>
                            {selectedConvo.address ? `to ${selectedConvo.address}` : `via ${channelName}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${
                          currentTheme === 'dark'
                            ? 'bg-purple-500/10 text-purple-400 border border-primary/20'
                            : 'bg-primary/5 text-primary border border-primary/20'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {selectedConvo.time}
                        </div>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto overflow-x-hidden">
                      {isMarcusDemo ? (
                        <>
                          {/* Message 1: Customer urgent message */}
                          <div className="flex gap-3 ar-msg ar-msg-1 min-w-0">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${selectedConvo.gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                              MR
                            </div>
                            <div className="min-w-0 max-w-[80%]">
                              <div className={`rounded-lg px-3 py-2 text-xs ${
                                currentTheme === 'dark'
                                  ? 'bg-slate-700/50 text-slate-100'
                                  : 'bg-gray-100 text-gray-900'
                              }`}>
                                Hey, this is urgent &mdash; we&apos;re completely out of Ethiopian Yirgacheffe and I open at 6am tomorrow. Can you help?
                              </div>
                              <span className={`text-[10px] mt-1 block ${
                                currentTheme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                              }`}>11:47 PM</span>
                            </div>
                          </div>

                          {/* AI typing indicator before msg 2 */}
                          <div className="flex gap-3 justify-end ar-typing-indicator ar-typing-before-2 min-w-0">
                            <div className={`rounded-full px-3 py-2 flex items-center gap-1 ${
                              currentTheme === 'dark' ? 'bg-slate-700/50 text-purple-400' : 'bg-purple-100 text-purple-500'
                            }`}>
                              <span className="ar-dot"></span>
                              <span className="ar-dot"></span>
                              <span className="ar-dot"></span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              AI
                            </div>
                          </div>

                          {/* Message 2: AI greeting */}
                          <div className="flex gap-3 justify-end ar-msg ar-msg-2 min-w-0">
                            <div className="min-w-0 max-w-[80%] flex flex-col items-end">
                              <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg px-3 py-2 text-xs text-white">
                                Hi Marcus! I can see you&apos;re a regular &mdash; let me pull up your last order right away. {'\u{1F50D}'}
                              </div>
                              <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                11:47 PM &bull; AI Auto-Reply
                                <Sparkles className="w-3 h-3 text-purple-400" />
                              </span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              AI
                            </div>
                          </div>

                          {/* AI typing indicator before msg 3 */}
                          <div className="flex gap-3 justify-end ar-typing-indicator ar-typing-before-3 min-w-0">
                            <div className={`rounded-full px-3 py-2 flex items-center gap-1 ${
                              currentTheme === 'dark' ? 'bg-slate-700/50 text-purple-400' : 'bg-purple-100 text-purple-500'
                            }`}>
                              <span className="ar-dot"></span>
                              <span className="ar-dot"></span>
                              <span className="ar-dot"></span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              AI
                            </div>
                          </div>

                          {/* Message 3: Order summary card */}
                          <div className="flex gap-3 justify-end ar-msg ar-msg-3 min-w-0">
                            <div className="min-w-0 max-w-[85%] flex flex-col items-end">
                              <div className={`rounded-lg overflow-hidden border ${
                                currentTheme === 'dark'
                                  ? 'bg-slate-800 border-primary/20'
                                  : 'bg-white border-purple-200 shadow-sm'
                              }`}>
                                <div className={`px-3 py-2 flex items-center gap-2 ${
                                  currentTheme === 'dark'
                                    ? 'bg-primary/10 border-b border-primary/20'
                                    : 'bg-purple-50 border-b border-purple-100'
                                }`}>
                                  <Package className="w-3.5 h-3.5 text-primary" />
                                  <span className={`text-[11px] font-semibold ${
                                    currentTheme === 'dark' ? 'text-purple-400' : 'text-purple-700'
                                  }`}>Order Summary &mdash; Based on Previous Order</span>
                                </div>
                                <div className="px-3 py-2.5 space-y-2">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className={currentTheme === 'dark' ? 'text-slate-300' : 'text-gray-700'}>
                                      Ethiopian Yirgacheffe (2lb) &times; 5
                                    </span>
                                    <span className={`font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>$94.95</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className={currentTheme === 'dark' ? 'text-slate-300' : 'text-gray-700'}>
                                      Rush Delivery {'\u{1F69A}'}
                                    </span>
                                    <span className={`font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>$6.99</span>
                                  </div>
                                  <div className={`border-t pt-2 mt-2 flex items-center justify-between text-xs font-bold ${
                                    currentTheme === 'dark' ? 'border-slate-700 text-white' : 'border-gray-200 text-gray-900'
                                  }`}>
                                    <span>Total</span>
                                    <span>$101.94</span>
                                  </div>
                                  <div className={`flex items-center gap-1.5 text-[10px] font-medium ${
                                    currentTheme === 'dark' ? 'text-green-400' : 'text-green-600'
                                  }`}>
                                    <Zap className="w-3 h-3" />
                                    Estimated delivery: By 5:30 AM
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                11:47 PM &bull; AI Auto-Reply
                                <Sparkles className="w-3 h-3 text-purple-400" />
                              </span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              AI
                            </div>
                          </div>

                          {/* AI typing indicator before msg 4 */}
                          <div className="flex gap-3 justify-end ar-typing-indicator ar-typing-before-4 min-w-0">
                            <div className={`rounded-full px-3 py-2 flex items-center gap-1 ${
                              currentTheme === 'dark' ? 'bg-slate-700/50 text-purple-400' : 'bg-purple-100 text-purple-500'
                            }`}>
                              <span className="ar-dot"></span>
                              <span className="ar-dot"></span>
                              <span className="ar-dot"></span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              AI
                            </div>
                          </div>

                          {/* Message 4: Confirmation prompt */}
                          <div className="flex gap-3 justify-end ar-msg ar-msg-4 min-w-0">
                            <div className="min-w-0 max-w-[80%] flex flex-col items-end">
                              <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg px-3 py-2 text-xs text-white">
                                I&apos;ve prepared your usual order with rush shipping. Reply Y to confirm, N to cancel, or type any changes you need!
                              </div>
                              <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                11:48 PM &bull; AI Auto-Reply
                                <Sparkles className="w-3 h-3 text-purple-400" />
                              </span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              AI
                            </div>
                          </div>

                          {/* Message 5: Customer "Y" */}
                          <div className="flex gap-3 ar-msg ar-msg-5 min-w-0">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${selectedConvo.gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                              MR
                            </div>
                            <div className="min-w-0 max-w-[80%]">
                              <div className={`rounded-lg px-3 py-2 text-xs ${
                                currentTheme === 'dark'
                                  ? 'bg-slate-700/50 text-slate-100'
                                  : 'bg-gray-100 text-gray-900'
                              }`}>
                                <span className="font-bold text-sm">Y</span>
                              </div>
                              <span className={`text-[10px] mt-1 block ${
                                currentTheme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                              }`}>11:48 PM</span>
                            </div>
                          </div>

                          {/* AI typing indicator before msg 6 */}
                          <div className="flex gap-3 justify-end ar-typing-indicator ar-typing-before-6 min-w-0">
                            <div className={`rounded-full px-3 py-2 flex items-center gap-1 ${
                              currentTheme === 'dark' ? 'bg-slate-700/50 text-purple-400' : 'bg-purple-100 text-purple-500'
                            }`}>
                              <span className="ar-dot"></span>
                              <span className="ar-dot"></span>
                              <span className="ar-dot"></span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              AI
                            </div>
                          </div>

                          {/* Message 6: Final confirmation */}
                          <div className="flex gap-3 justify-end ar-msg ar-msg-6 min-w-0">
                            <div className="min-w-0 max-w-[80%] flex flex-col items-end">
                              <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg px-3 py-2 text-xs text-white">
                                Order #5847 confirmed! You&apos;ll receive shipping confirmation by 6:30 AM. Have a great morning rush, Marcus!
                              </div>
                              <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                11:48 PM &bull; AI Auto-Reply
                                <Sparkles className="w-3 h-3 text-purple-400" />
                                <span className="ar-check-bounce inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500">
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </span>
                              </span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              AI
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Static messages for other conversations */
                        selectedConvo.messages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex gap-3 min-w-0 ${msg.from === 'ai' ? 'justify-end' : ''} animate-message-in`}
                            style={{ animationDelay: `${idx * 100}ms` }}
                          >
                            {msg.from === 'customer' && (
                              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${selectedConvo.gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                {selectedConvo.initials}
                              </div>
                            )}
                            <div className={`min-w-0 max-w-[80%] ${msg.from === 'ai' ? 'flex flex-col items-end' : ''}`}>
                              <div className={`rounded-lg px-3 py-2 text-xs ${
                                msg.from === 'ai'
                                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
                                  : currentTheme === 'dark'
                                    ? 'bg-slate-700/50 text-slate-100'
                                    : 'bg-gray-100 text-gray-900'
                              }`}>
                                {msg.text}
                              </div>
                              <span className={`text-[10px] mt-1 flex items-center gap-1 ${
                                currentTheme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                              }`}>
                                {msg.time}
                                {msg.from === 'ai' && (
                                  <>
                                    {' \u2022 AI Auto-Reply'}
                                    <Sparkles className="w-3 h-3 text-purple-400" />
                                  </>
                                )}
                              </span>
                            </div>
                            {msg.from === 'ai' && (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                AI
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Chat Input - Disabled */}
                    <div className={`border-t p-4 ${
                      currentTheme === 'dark' ? 'border-slate-700 bg-[#0f1621]' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex gap-2 items-center">
                        <div className={`flex-1 rounded-lg px-3 py-2 text-xs flex items-center gap-2 ${
                          currentTheme === 'dark'
                            ? 'bg-slate-800 text-purple-400/60'
                            : 'bg-white border border-gray-300 text-primary/60'
                        }`}>
                          <Sparkles className="w-3 h-3 flex-shrink-0" />
                          AI auto-reply is handling this conversation...
                        </div>
                        <button disabled className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 opacity-50 cursor-not-allowed ${
                          currentTheme === 'dark'
                            ? 'bg-slate-700 text-slate-400'
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          <Send className="w-3 h-3" />
                          Send
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
