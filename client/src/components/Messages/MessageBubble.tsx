import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
  researcherName?: string;
  researcherAvatar?: string;
}

export function MessageBubble({ message, isUser, researcherName, researcherAvatar }: MessageBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%]">
          <div className="rounded-[8px] rounded-br-[2px] px-4 py-2 bg-[#1a3a2a] text-[var(--text-main)] border border-[var(--brand-green)] border-opacity-30">
            <p className="text-[20px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="text-[12px] text-right mt-1 text-[var(--text-dim)]">
            {time}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <div className="flex items-center gap-2 mb-1">
          {researcherAvatar ? (
            <img
              src={researcherAvatar}
              alt={researcherName || 'Researcher'}
              className="w-6 h-6 rounded-full object-cover"
              onError={(e) => {
                // 头像加载失败时显示首字母
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-[var(--bg-highlight)] text-[var(--text-main)] ${researcherAvatar ? 'hidden' : ''}`}>
            {researcherName?.charAt(0) || 'R'}
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">
            {researcherName || 'Researcher'}
          </span>
        </div>
        <div className="rounded-[8px] rounded-bl-[2px] px-4 py-2 bg-[var(--bg-surface)] text-[var(--text-main)]">
          <p className="text-[20px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className="text-[12px] mt-1 text-[var(--text-dim)]">
          {time}
        </p>
      </div>
    </div>
  );
}
