import { useState, useRef, useEffect } from 'react';
import { Send, HelpCircle, MessageCircle, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatStore } from '../../stores/chatStore';
import { useUserStore } from '../../stores/userStore';
import { RoboCatIcon } from '../trading/RoboCatIcon';
import type { UserLevel } from '../../types';

// FAQ 常见问题
const faqQuestions = [
  { label: '如何交易？', question: '请介绍一下如何在平台上进行交易？' },
  { label: '费用说明', question: '平台的交易费用是怎么计算的？' },
  { label: '能量值用途', question: '能量值有什么用？如何获取更多能量值？' },
  { label: '提升等级', question: '如何提升用户等级？不同等级有什么权益？' },
];

// 支持链接
const DISCORD_LINK = 'https://discord.gg/sodex';
const TICKET_LINK = 'https://support.sodex.io/ticket';

export function AIChat() {
  const { aiMessages, isAITyping, sendAIMessage } = useChatStore();
  const { user } = useUserStore();
  const [input, setInput] = useState('');
  const [showSupportPrompt, setShowSupportPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userLevel = (user?.level || 'Bronze') as UserLevel;

  // 检测是否需要显示工单/Discord提示（多轮对话后）
  useEffect(() => {
    if (aiMessages.length >= 6 && !showSupportPrompt) {
      setShowSupportPrompt(true);
    }
  }, [aiMessages.length]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAITyping]);

  // Focus input on mount - only on desktop to prevent mobile keyboard popup
  useEffect(() => {
    // Only auto-focus on desktop (md: breakpoint is 768px)
    if (window.innerWidth >= 768) {
      inputRef.current?.focus();
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isAITyping) return;
    const message = input.trim();
    setInput('');
    await sendAIMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Welcome Message */}
        {aiMessages.length === 0 && (
          <div className="flex gap-2">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <RoboCatIcon size={32} level={userLevel} />
            </div>
            <div className="flex-1">
              <div className="bg-[var(--bg-surface)] rounded-lg rounded-tl-none p-4 text-[20px] leading-relaxed text-[var(--text-main)]">
                您好！我是 SoDEX AI 研究员，有什么可以帮您？
                <br /><br />
                我可以为您解答：
                <ul className="list-disc ml-4 mt-2 text-[var(--text-muted)]">
                  <li>平台使用指南</li>
                  <li>交易规则与费用</li>
                  <li>能量值与等级系统</li>
                  <li>账户相关问题</li>
                </ul>
              </div>
              <div className="text-[9px] text-[var(--text-muted)] mt-1">AI 研究员</div>

              {/* FAQ Quick Questions */}
              <div className="mt-3">
                <div className="flex items-center gap-1 mb-2">
                  <HelpCircle size={12} className="text-[var(--text-muted)]" />
                  <span className="text-[10px] text-[var(--text-muted)]">常见问题</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {faqQuestions.map((faq, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendAIMessage(faq.question)}
                      className="px-2.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-full text-[10px] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--brand-yellow)] transition"
                    >
                      {faq.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {aiMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <RoboCatIcon size={32} level={userLevel} />
              </div>
            )}
            <div className={`flex-1 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
              <div
                className={`rounded-lg p-4 text-[20px] leading-relaxed max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-[#1a3a2a] text-[var(--text-main)] rounded-tr-none whitespace-pre-wrap border border-[var(--brand-green)] border-opacity-30'
                    : 'bg-[var(--bg-surface)] text-[var(--text-main)] rounded-tl-none prose prose-sm prose-invert max-w-none'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // 自定义组件样式
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="text-[var(--text-main)]">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-[var(--brand-yellow)]">{children}</strong>,
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-green)] hover:underline">
                          {children}
                        </a>
                      ),
                      code: ({ children }) => (
                        <code className="bg-[var(--bg-app)] px-1 py-0.5 rounded text-[11px] text-[var(--brand-yellow)]">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-[var(--bg-app)] p-2 rounded my-2 overflow-x-auto text-[11px]">
                          {children}
                        </pre>
                      ),
                      h1: ({ children }) => <h1 className="text-[14px] font-bold mb-2 text-[var(--text-main)]">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-[13px] font-bold mb-2 text-[var(--text-main)]">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-[12px] font-bold mb-1 text-[var(--text-main)]">{children}</h3>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-[var(--brand-yellow)] pl-3 my-2 text-[var(--text-muted)] italic">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
              <div className={`text-[11px] text-[var(--text-muted)] mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                {msg.role === 'user' ? 'You' : 'AI Assistant'} • {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isAITyping && (
          <div className="flex gap-2">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <RoboCatIcon size={32} level={userLevel} animated />
            </div>
            <div className="bg-[var(--bg-surface)] rounded-lg rounded-tl-none p-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}

        {/* Support Prompt - Shows after multiple rounds */}
        {showSupportPrompt && (
          <div className="bg-[var(--bg-surface)] rounded-lg p-3 mx-2 border border-[var(--border-light)]">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle size={14} className="text-[var(--brand-yellow)]" />
              <span className="text-[11px] font-medium text-[var(--text-main)]">需要更多帮助？</span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mb-3">
              如果AI研究员无法解决您的问题，您可以提交工单或加入我们的Discord社区获得人工支持。
            </p>
            <div className="flex gap-2">
              <a
                href={TICKET_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[var(--brand-yellow)] text-black rounded-lg text-[10px] font-medium hover:opacity-90 transition"
              >
                <ExternalLink size={12} />
                提交工单
              </a>
              <a
                href={DISCORD_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#5865F2] text-white rounded-lg text-[10px] font-medium hover:opacity-90 transition"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                加入 Discord
              </a>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-[var(--border-light)] bg-[var(--bg-panel)]">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isAITyping}
            className="flex-1 bg-[var(--bg-surface)] text-[var(--text-main)] text-[20px] px-4 py-3 rounded-lg border border-transparent focus:border-[var(--brand-yellow)] focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isAITyping}
            className="px-3 py-2 bg-[var(--brand-yellow)] text-black rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="text-[9px] text-[var(--text-muted)] mt-2 text-center">
          由 Dify AI 提供支持 • 升级到 Gold 解锁专属研究员
        </div>
      </div>
    </div>
  );
}
