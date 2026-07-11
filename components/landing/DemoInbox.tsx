'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  Lightbulb,
} from 'lucide-react';
import {
  demoConversations,
  channelConfig,
  formatNameForNarrow,
  isPhoneNumber,
} from './demo-data';

interface DemoInboxProps {
  currentTheme: string;
  isVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  loading: boolean;
  user: unknown;
}

export default function DemoInbox({ currentTheme, isVisible, onVisibilityChange, loading, user }: DemoInboxProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedConvoId, setSelectedConvoId] = useState('sarah');
  const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isIconOnly = sidebarWidth !== null && sidebarWidth < 80;
  const isCompact = sidebarWidth !== null && sidebarWidth < 140;
  const isNarrow = sidebarWidth !== null && sidebarWidth < 200;

  const getConstraints = () => {
    if (!containerRef.current) return { min: 100, max: 200, initial: 150 };
    const containerWidth = containerRef.current.offsetWidth;
    const minWidth = Math.max(52, containerWidth * 0.05);
    const maxWidth = Math.min(400, containerWidth * 0.5);
    const initialWidth = Math.min(280, containerWidth * 0.35);
    return { min: minWidth, max: maxWidth, initial: initialWidth };
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && containerRef.current && sidebarWidth === null) {
      const { initial } = getConstraints();
      setSidebarWidth(initial);
    }
  }, [mounted, sidebarWidth]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && sidebarWidth !== null) {
        const { min, max } = getConstraints();
        setSidebarWidth(prev => Math.min(Math.max(prev || min, min), max));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarWidth]);

  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!isDragging || !containerRef.current) return;
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newWidth = clientX - containerRect.left;
      const { min, max } = getConstraints();
      const constrainedWidth = Math.min(Math.max(newWidth, min), max);
      setSidebarWidth(constrainedWidth);
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleMove(e.touches[0].clientX);
    };
    const handleEnd = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  useEffect(() => {
    if (loading || user) return;
    const currentRef = heroRef.current;
    if (!currentRef) return;

    const isSmallScreen = window.innerWidth < 1024;
    const animationObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          onVisibilityChange(entry.isIntersecting);
        });
      },
      { threshold: isSmallScreen ? 0.1 : 0.2, rootMargin: '100px' }
    );

    requestAnimationFrame(() => {
      const rect = currentRef.getBoundingClientRect();
      const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      const visibleRatio = visibleHeight / rect.height;
      const shouldTrigger = visibleRatio >= (isSmallScreen ? 0.3 : 0.5);
      if (shouldTrigger) onVisibilityChange(true);
    });

    animationObserver.observe(currentRef);
    return () => { animationObserver.unobserve(currentRef); };
  }, [loading, user, onVisibilityChange]);

  return (
    <div ref={heroRef} className={`mt-16 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 overflow-hidden shadow-2xl relative hero-demo-container ${isVisible ? 'hero-visible' : ''}`}>
      <div className="aspect-video flex items-center md:items-stretch justify-center p-4">
        <div
          ref={containerRef}
          className={`w-full md:h-full rounded-lg border shadow-xl overflow-hidden flex ${
          currentTheme === 'dark'
            ? 'bg-[#1a2332] border-slate-700'
            : 'bg-white border-gray-200'
        }`}>
          {/* Left Sidebar - Conversations List */}
          <div
            style={sidebarWidth ? { width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` } : undefined}
            className={`border-r flex-col flex-shrink-0 flex ${
              !sidebarWidth ? 'w-[35%] min-w-[52px] max-w-[280px]' : ''
            } ${
            currentTheme === 'dark'
              ? 'bg-[#0f1621] border-slate-700'
              : 'bg-gray-50 border-gray-200'
          }`}>
            {/* Inbox Header */}
            <div className={`p-4 border-b transition-all ${
              isIconOnly ? 'p-2 flex justify-center' : isCompact ? 'p-2 flex justify-center' : ''
            } ${
              currentTheme === 'dark' ? 'border-slate-700' : 'border-gray-200'
            }`}>
              {isCompact ? (
                <MessageSquare className={`text-primary ${isIconOnly ? 'w-4 h-4' : 'w-5 h-5'}`} />
              ) : (
                <>
                  <h2 className={`font-semibold text-sm flex items-center gap-2 ${
                    currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    <MessageSquare className="w-4 h-4 text-primary" />
                    {!isNarrow && 'Inbox'}
                  </h2>
                  {!isNarrow && (
                    <p className={`text-xs mt-0.5 ${
                      currentTheme === 'dark' ? 'text-slate-400' : 'text-gray-500'
                    }`}>{demoConversations.length} conversations</p>
                  )}
                </>
              )}
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-hidden">
              <div className={`p-2 space-y-1 ${isCompact ? 'flex flex-col items-center' : ''} ${isIconOnly ? 'p-1 space-y-0.5' : ''}`}>
                {demoConversations.map((convo) => {
                  const channel = channelConfig[convo.channel];
                  const isPhone = isPhoneNumber(convo.name);
                  const isSelected = selectedConvoId === convo.id;
                  const lastMessage = convo.messages[convo.messages.length - 1];

                  return (
                    <div
                      key={convo.id}
                      onClick={() => setSelectedConvoId(convo.id)}
                      title={convo.name}
                      className={`flex items-center gap-3 p-2 rounded-lg animate-slide-up-fade-in animation-delay-sidebar transition-all cursor-pointer ${
                        isIconOnly ? 'p-1 justify-center w-full' : isCompact ? 'p-1.5 justify-center w-fit' : ''
                      } ${
                        isSelected
                          ? isIconOnly
                            ? currentTheme === 'dark'
                              ? 'bg-primary/20 border-l-2 border-l-primary rounded-none'
                              : 'bg-primary/10 border-l-2 border-l-primary rounded-none'
                            : currentTheme === 'dark'
                              ? 'bg-slate-800/50 border border-primary/20'
                              : 'bg-white border border-gray-200 shadow-sm'
                          : currentTheme === 'dark'
                            ? 'hover:bg-slate-800/30'
                            : 'hover:bg-gray-100'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className={`rounded-full bg-gradient-to-br ${convo.gradient} flex items-center justify-center text-white font-bold ${
                          isIconOnly ? 'w-8 h-8 text-[10px]' : 'w-10 h-10 text-xs'
                        }`}>
                          {convo.initials}
                        </div>
                        {isCompact && !isIconOnly && (
                          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${channel.badgeColor} flex items-center justify-center border-2 ${
                            currentTheme === 'dark' ? 'border-slate-800' : 'border-gray-100'
                          }`}>
                            <span className="w-2 h-2 text-white flex items-center justify-center [&>svg]:w-2 [&>svg]:h-2">
                              {channel.icon}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      {!isCompact && (
                        <>
                          <div className={`flex-1 min-w-0 ${isPhone ? 'overflow-hidden' : ''}`}>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs truncate ${
                                isPhone && isNarrow ? 'whitespace-nowrap animate-marquee' : ''
                              } ${
                                isSelected
                                  ? currentTheme === 'dark' ? 'text-white font-medium' : 'text-gray-900 font-medium'
                                  : currentTheme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                              }`}>
                                {isNarrow ? formatNameForNarrow(convo.name) : convo.name}
                              </span>
                              <span className={`flex-shrink-0 ${channel.iconColor}`}>
                                {channel.icon}
                              </span>
                            </div>
                            {!isNarrow && (
                              <p className={`text-xs truncate ${
                                currentTheme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                              }`}>{lastMessage.text}</p>
                            )}
                          </div>
                          {!isNarrow && <span className="text-[10px] text-green-500 font-medium">open</span>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Resizable Divider */}
          <div
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
            className={`w-2 sm:w-1.5 cursor-col-resize flex-shrink-0 group relative transition-colors touch-none ${
              isDragging
                ? 'bg-primary'
                : currentTheme === 'dark'
                  ? 'bg-slate-700 hover:bg-primary/60 active:bg-primary'
                  : 'bg-gray-200 hover:bg-primary/40 active:bg-primary/60'
            }`}
          >
            <div className="absolute inset-y-0 -left-2 -right-2 sm:-left-1 sm:-right-1" />
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-0.5 transition-opacity ${isDragging ? 'opacity-100' : 'opacity-60 sm:opacity-0 sm:group-hover:opacity-100'}`}>
              <div className="w-1 h-1 sm:w-0.5 sm:h-0.5 rounded-full bg-white/80"></div>
              <div className="w-1 h-1 sm:w-0.5 sm:h-0.5 rounded-full bg-white/80"></div>
              <div className="w-1 h-1 sm:w-0.5 sm:h-0.5 rounded-full bg-white/80"></div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col relative min-h-0 min-w-0 overflow-hidden">
            {(() => {
              const selectedConvo = demoConversations.find(c => c.id === selectedConvoId) || demoConversations[0];
              const channel = channelConfig[selectedConvo.channel];
              const channelName = selectedConvo.channel.charAt(0).toUpperCase() + selectedConvo.channel.slice(1);
              const isSarahDemo = selectedConvoId === 'sarah';

              return (
                <>
                  {/* Chat Header */}
                  <div className={`h-16 border-b flex items-center px-4 sm:px-6 animate-slide-up-fade-in animation-delay-sidebar ${
                    currentTheme === 'dark'
                      ? 'bg-[#0f1621] border-slate-700'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${selectedConvo.gradient} flex items-center justify-center text-white text-sm font-bold`}>
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
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto overflow-x-hidden">
                    {isSarahDemo ? (
                      <>
                        {/* ANIMATED DEMO for Sarah - typing effects, AI panel, etc. */}
                        {/* Message 1: Customer asks about decaf */}
                        <div className="flex gap-3 animate-slide-up-fade-in animation-delay-600 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            SC
                          </div>
                          <div className="min-w-0 max-w-[80%]">
                            <div className={`rounded-lg px-3 py-2 text-xs overflow-hidden ${
                              currentTheme === 'dark'
                                ? 'bg-slate-700/50 text-slate-100'
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <span className="typing-text">Hi! Do you have any decaf coffee options? I love coffee but can&apos;t have caffeine {'\u{1F60A}'}</span>
                            </div>
                            <span className={`text-[10px] mt-1 block ${
                              currentTheme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                            }`}>2m ago</span>
                          </div>
                        </div>

                        {/* Reply 1: Human response */}
                        <div className="flex gap-3 justify-end animate-slide-up-fade-in animation-delay-1000 min-w-0">
                          <div className="min-w-0 max-w-[80%] flex flex-col items-end">
                            <div className="typing-bubble-wrap bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg px-3 py-2 text-xs text-white">
                              <span className="typing-text">Yes! We have 3 delicious decaf options: Swiss Water Decaf, French Vanilla Decaf, and Hazelnut Decaf {'\u2615'}</span>
                            </div>
                            <span className={`text-[10px] mt-1 ${
                              currentTheme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                            }`}>1m ago &bull; Support Team</span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            ST
                          </div>
                        </div>

                        {/* Message 2: Follow-up question */}
                        <div className="flex gap-3 animate-slide-up-fade-in animation-delay-1400 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            SC
                          </div>
                          <div className="min-w-0 max-w-[80%]">
                            <div className={`rounded-lg px-3 py-2 text-xs overflow-hidden ${
                              currentTheme === 'dark'
                                ? 'bg-slate-700/50 text-slate-100'
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <span className="typing-text">Perfect! Which one is most popular?</span>
                            </div>
                            <span className={`text-[10px] mt-1 block ${
                              currentTheme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                            }`}>30s ago</span>
                          </div>
                        </div>

                        {/* Generate AI Response button */}
                        <div className="absolute bottom-24 right-4 sm:right-6 animate-slide-up-fade-in animation-delay-1500" style={{ animationFillMode: 'forwards' }}>
                          <button className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-2.5 py-1.5 rounded-md text-[10px] font-semibold shadow-lg animate-button-click animation-delay-1800">
                            <Sparkles className="w-2.5 h-2.5" />
                            Generate AI Response
                          </button>
                        </div>

                        {/* AI Suggestion Panel */}
                        <div className="absolute bottom-20 left-4 right-4 sm:left-6 sm:right-6 animate-ai-panel animation-delay-2000" style={{ animationFillMode: 'forwards' }}>
                          <div className={`border-2 border-purple-500 rounded-lg p-4 shadow-2xl ${
                            currentTheme === 'dark' ? 'bg-slate-800' : 'bg-white'
                          }`}>
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="w-4 h-4 text-purple-400" />
                              <span className={`text-xs font-semibold ${
                                currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>AI Suggested Response</span>
                            </div>
                            <div className={`rounded-lg p-3 mb-3 ${
                              currentTheme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-50'
                            }`}>
                              <p className={`text-xs leading-relaxed ${
                                currentTheme === 'dark' ? 'text-slate-200' : 'text-gray-700'
                              }`}>
                                Our Swiss Water Decaf is definitely the customer favorite! It has a smooth, rich flavor and is processed without chemicals. Many customers say they can&apos;t even tell it&apos;s decaf {'\u{1F31F}'}
                              </p>
                            </div>
                            <button className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity animate-button-click animation-delay-2400">
                              Use This Response
                            </button>
                          </div>
                        </div>

                        {/* Reply 2: AI-assisted response */}
                        <div className="flex gap-3 justify-end animate-slide-up-fade-in animation-delay-2600 min-w-0">
                          <div className="min-w-0 max-w-[80%] flex flex-col items-end">
                            <div className="typing-bubble-wrap bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg px-3 py-2 text-xs text-white">
                              <span className="no-typing">Our Swiss Water Decaf is definitely the customer favorite! It has a smooth, rich flavor {'\u{1F31F}'}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                              Just now &bull; Support Team
                              <Sparkles className="w-3 h-3 text-purple-400" />
                            </span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            ST
                          </div>
                        </div>

                        {/* Message 3: Customer thanks */}
                        <div className="flex gap-3 animate-slide-up-fade-in animation-delay-3200 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            SC
                          </div>
                          <div className="min-w-0 max-w-[80%]">
                            <div className={`rounded-lg px-3 py-2 text-xs overflow-hidden ${
                              currentTheme === 'dark'
                                ? 'bg-slate-700/50 text-slate-100'
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <span className="typing-text">Awesome! I&apos;ll order that one. Thanks so much! {'\u{1F49C}'}</span>
                            </div>
                            <span className={`text-[10px] mt-1 block ${
                              currentTheme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                            }`}>Just now</span>
                          </div>
                        </div>

                        {/* Reply 3: Human closing */}
                        <div className="flex gap-3 justify-end animate-slide-up-fade-in animation-delay-3800 min-w-0">
                          <div className="min-w-0 max-w-[80%] flex flex-col items-end">
                            <div className="typing-bubble-wrap bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg px-3 py-2 text-xs text-white">
                              <span className="typing-text">You&apos;re so welcome! Enjoy your coffee, and feel free to reach out anytime {'\u2615\u2728'}</span>
                            </div>
                            <span className={`text-[10px] mt-1 ${
                              currentTheme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                            }`}>Just now &bull; Support Team</span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            ST
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Simple message list for other conversations */
                      selectedConvo.messages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex gap-3 min-w-0 ${msg.from === 'support' ? 'justify-end' : ''} animate-message-in`}
                          style={{ animationDelay: `${idx * 100}ms` }}
                        >
                          {msg.from === 'customer' && (
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${selectedConvo.gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                              {selectedConvo.initials}
                            </div>
                          )}
                          <div className={`min-w-0 max-w-[80%] ${msg.from === 'support' ? 'flex flex-col items-end' : ''}`}>
                            <div className={`rounded-lg px-3 py-2 text-xs ${
                              msg.from === 'support'
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
                              {msg.from === 'support' && ' \u2022 Support Team'}
                              {msg.isAiGenerated && <Sparkles className="w-3 h-3 text-purple-400" />}
                            </span>
                          </div>
                          {msg.from === 'support' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              ST
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Chat Input Area */}
                  <div className={`border-t p-4 ${
                    currentTheme === 'dark' ? 'border-slate-700 bg-[#0f1621]' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex gap-2 items-center">
                      <div className={`flex-1 rounded-lg px-3 py-2 text-xs ${
                        currentTheme === 'dark'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-white border border-gray-300 text-gray-400'
                      }`}>
                        Type your reply...
                      </div>
                      <button className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5">
                        <Send className="w-3 h-3" />
                        Send
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <button className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] border ${
                        currentTheme === 'dark'
                          ? 'border-slate-600 text-slate-300 bg-slate-800'
                          : 'border-gray-300 text-gray-600 bg-white'
                      }`}>
                        <MessageSquare className="w-3 h-3" />
                        Quick Replies
                      </button>
                      <div className={`flex items-center gap-1 text-[8px] ${
                        currentTheme === 'dark' ? 'text-slate-500/70' : 'text-gray-400/70'
                      }`}>
                        <Lightbulb className="w-2.5 h-2.5 text-yellow-500/70" />
                        Enter to send, Shift+Enter for new line
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
