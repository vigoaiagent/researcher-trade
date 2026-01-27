import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Image as ImageIcon,
  Video,
  Smile,
  Hash,
  BarChart3,
  Plus,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronUp,
  GripHorizontal,
} from 'lucide-react';
import { CoinTag } from './CoinTag';

interface PostEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (postData: PostData) => Promise<void>;
}

export interface PostData {
  title?: string;
  content: string;
  images: string[];
  videos: string[];
  tags: string[];
  detectedCoins: string[];
  chartUrl?: string;
  poll?: PollConfig;
}

interface PollConfig {
  question: string;
  options: string[];
  endDate: Date;
  type: 'single' | 'multiple';
}

// Mock 热点话题数据
const mockTrendingTopics = [
  { id: '1', name: 'AI巨头集体入局创世纪计划！', type: 'news' as const },
  { id: '2', name: '存储概念狂飙！', type: 'news' as const },
  { id: '3', name: '格林兰岛事件对BTC的影响', type: 'news' as const },
  { id: '4', name: '电力设备', type: 'news' as const },
  { id: '5', name: 'Trump x Greenland deal', type: 'polymarket' as const },
  { id: '6', name: '特朗普会在2027年前收购格陵兰吗', type: 'polymarket' as const },
];

// Mock SoSoValue 图表数据
const mockChartOptions = [
  { id: 'btc-etf', name: '比特币现货ETF总净流入', url: '/charts/btc-etf' },
  { id: 'eth-etf', name: '以太坊现货ETF总净流入', url: '/charts/eth-etf' },
  { id: 'fear-greed', name: '恐慌和贪婪指数', url: '/charts/fear-greed' },
];

// 代币列表
const COIN_SYMBOLS = ['BTC', 'ETH', 'SOL', 'ARB', 'OP', 'BONK', 'JUP', 'DOGE', 'SHIB', 'PEPE'];

// 常用表情
const EMOJI_LIST = [
  '😊', '😂', '🤣', '😍', '🥰', '😎', '🤔', '😭', '😱', '🔥',
  '💪', '👍', '👏', '🙏', '💰', '📈', '📉', '🚀', '💎', '⚡',
];

export function PostEditor({ isOpen, onClose, onSubmit }: PostEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [detectedCoins, setDetectedCoins] = useState<string[]>([]);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // UI状态
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [showChartPicker, setShowChartPicker] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [isTopicListExpanded, setIsTopicListExpanded] = useState(true);

  // 投票/PK 配置
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollEndDate, setPollEndDate] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  // 提交状态
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 拖拽状态
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // 初始化位置到屏幕中心偏右
  useEffect(() => {
    if (isOpen) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      setPosition({
        x: windowWidth - 520, // 靠右
        y: Math.max(50, (windowHeight - 600) / 2),
      });
    } else {
      // 关闭时重置位置
      setPosition(null);
    }
  }, [isOpen]);

  // 拖拽逻辑
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.editor-drag-handle')) {
      setIsDragging(true);
      const rect = panelRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isOpen || position === null) return null;

  // 自动识别代币
  const detectCoins = (text: string) => {
    const foundCoins = new Set<string>();
    const upperText = text.toUpperCase();

    COIN_SYMBOLS.forEach(symbol => {
      const regex = new RegExp(`\\b${symbol}\\b`, 'g');
      if (regex.test(upperText)) {
        foundCoins.add(symbol);
      }
    });

    return Array.from(foundCoins);
  };

  // 处理文本变化
  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    const coins = detectCoins(newContent);
    setDetectedCoins(coins);
  };

  // 处理粘贴
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    const coins = detectCoins(pastedText);
    setDetectedCoins(prev => [...new Set([...prev, ...coins])]);
  };

  // 插入表情
  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.slice(0, start) + emoji + content.slice(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);

    setShowEmojiPicker(false);
  };

  // 插入话题
  const insertTopic = (topic: string) => {
    setSelectedTopics(prev => {
      if (prev.includes(topic)) {
        return prev.filter(t => t !== topic);
      }
      return [...prev, topic];
    });
  };

  // 处理图片上传
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      setImages(prev => [...prev, url]);
    });
  };

  // 处理视频上传
  const handleVideoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const url = URL.createObjectURL(files[0]);
    setVideos(prev => [...prev, url]);
  };

  // 移除图片
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 移除代币
  const removeCoin = (coin: string) => {
    setDetectedCoins(prev => prev.filter(c => c !== coin));
  };

  // 添加投票选项
  const addPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, '']);
    }
  };

  // 移除投票选项
  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  // 更新投票选项
  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  // 提交发帖
  const handleSubmit = async () => {
    if (!content.trim() && !pollQuestion) {
      alert('请输入内容或创建投票');
      return;
    }

    setIsSubmitting(true);

    try {
      // 构建投票/PK配置
      let pollConfig: PollConfig | undefined;
      if (showPollCreator && pollQuestion.trim()) {
        const validOptions = pollOptions.filter(opt => opt.trim());
        if (validOptions.length >= 2) {
          pollConfig = {
            question: pollQuestion,
            options: validOptions,
            endDate: pollEndDate,
            type: 'single',
          };
        }
      }

      const postData: PostData = {
        title: title.trim() || undefined,
        content,
        images,
        videos,
        tags: [...selectedTopics, ...detectedCoins],
        detectedCoins,
        chartUrl: selectedChart || undefined,
        poll: pollConfig,
      };

      await onSubmit?.(postData);

      // 重置表单
      setTitle('');
      setContent('');
      setImages([]);
      setVideos([]);
      setDetectedCoins([]);
      setSelectedTopics([]);
      setSelectedChart(null);
      setPollQuestion('');
      setPollOptions(['', '']);
      setShowPollCreator(false);

      onClose();
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[400] rounded-2xl overflow-hidden shadow-2xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '480px',
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        handleMouseDown(e);
      }}
    >
      <div className="bg-[var(--bg-panel)] flex flex-col max-h-[80vh]">
        {/* Header - 可拖拽 */}
        <div className="editor-drag-handle h-12 border-b border-[var(--border-light)] flex items-center justify-between px-4 cursor-move bg-[var(--bg-panel)]">
          <div className="flex items-center gap-2">
            <GripHorizontal size={16} className="text-[var(--text-dim)]" />
            <span className="text-[15px] font-bold text-[var(--text-main)]">发表动态</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--bg-surface)] rounded-lg transition"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <X size={18} className="text-[var(--text-muted)] hover:text-[var(--text-main)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* 标题输入 */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="标题（可选）"
              maxLength={100}
              className="w-full mb-3 px-3 py-2.5 bg-[var(--bg-surface)] rounded-lg text-[14px] font-medium text-[var(--text-main)] placeholder:text-[var(--text-dim)] border border-[var(--border-light)] focus:outline-none focus:border-[var(--brand-yellow)] transition-colors"
            />

            {/* 内容输入 */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onPaste={handlePaste}
              placeholder="分享你的想法..."
              maxLength={10000}
              className="w-full min-h-[160px] px-3 py-2.5 bg-[var(--bg-surface)] rounded-lg text-[14px] leading-relaxed text-[var(--text-main)] placeholder:text-[var(--text-dim)] border border-[var(--border-light)] focus:outline-none focus:border-[var(--brand-yellow)] resize-none transition-colors"
            />

            {/* 已选图表 */}
            {selectedChart && (
              <div className="mt-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-light)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-[var(--brand-yellow)]" />
                    <span className="text-[13px] text-[var(--text-main)]">
                      {mockChartOptions.find(c => c.url === selectedChart)?.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedChart(null)}
                    className="p-1 hover:bg-[var(--bg-app)] rounded"
                  >
                    <X size={14} className="text-[var(--text-muted)]" />
                  </button>
                </div>
              </div>
            )}

            {/* 投票/PK 创建器 */}
            {showPollCreator && (
              <div className="mt-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-light)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-[var(--text-main)]">
                    {pollOptions.length === 2 ? 'PK 对决' : '投票'}设置
                  </span>
                  <button
                    onClick={() => {
                      setShowPollCreator(false);
                      setPollQuestion('');
                      setPollOptions(['', '']);
                    }}
                    className="p-1 hover:bg-[var(--bg-app)] rounded"
                  >
                    <X size={14} className="text-[var(--text-muted)]" />
                  </button>
                </div>

                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="投票标题"
                  maxLength={50}
                  className="w-full mb-2 px-3 py-2 bg-[var(--bg-app)] border border-[var(--border-light)] rounded-lg text-[13px] text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--brand-yellow)] transition-colors"
                />

                <div className="space-y-2 mb-2">
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updatePollOption(index, e.target.value)}
                        placeholder={`选项${index + 1}`}
                        maxLength={30}
                        className="flex-1 px-3 py-2 bg-[var(--bg-app)] border border-[var(--border-light)] rounded-lg text-[13px] text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--brand-yellow)] transition-colors"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          onClick={() => removePollOption(index)}
                          className="p-1.5 hover:bg-[var(--bg-app)] rounded-lg transition"
                        >
                          <Trash2 size={14} className="text-[var(--text-muted)]" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {pollOptions.length < 10 && (
                  <button
                    onClick={addPollOption}
                    className="w-full py-1.5 mb-2 rounded-lg border border-dashed border-[var(--border-light)] text-[12px] text-[var(--text-muted)] hover:border-[var(--brand-yellow)] hover:text-[var(--brand-yellow)] transition"
                  >
                    + 添加选项
                  </button>
                )}

                <div className="flex items-center gap-2 text-[11px]">
                  <Calendar size={12} className="text-[var(--text-muted)]" />
                  <span className="text-[var(--text-muted)]">截止:</span>
                  <input
                    type="date"
                    value={pollEndDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      if (!isNaN(newDate.getTime())) {
                        setPollEndDate(newDate);
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="px-2 py-1 bg-[var(--bg-panel)] border border-[var(--border-light)] rounded text-[11px] text-[var(--text-main)] focus:outline-none focus:border-[var(--brand-yellow)] cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* 图片预览 */}
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-[var(--bg-surface)]">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-full transition"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 已识别代币 */}
            {detectedCoins.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
                <div className="text-[11px] text-[var(--text-muted)] mb-1.5">已识别代币</div>
                <div className="flex flex-wrap gap-1.5">
                  {detectedCoins.map(coin => (
                    <div key={coin} className="relative group">
                      <CoinTag symbol={coin} />
                      <button
                        onClick={() => removeCoin(coin)}
                        className="absolute -top-1 -right-1 p-0.5 bg-[var(--bg-panel)] rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={10} className="text-[var(--text-muted)]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 已选话题 */}
            {selectedTopics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedTopics.map(topic => (
                  <span
                    key={topic}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-surface)] text-[11px]"
                  >
                    <span className="text-[#FF8A00]">#</span>
                    <span className="text-[var(--text-main)]">{topic}</span>
                    <button onClick={() => insertTopic(topic)}>
                      <X size={10} className="text-[var(--text-muted)]" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 表情选择器 */}
          {showEmojiPicker && (
            <div className="px-4 pb-3">
              <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-light)]">
                <div className="grid grid-cols-10 gap-1">
                  {EMOJI_LIST.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => insertEmoji(emoji)}
                      className="text-[18px] hover:bg-[var(--bg-app)] rounded p-1 transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 话题选择器 */}
          {showTopicPicker && (
            <div className="px-4 pb-3">
              <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-light)]">
                <button
                  onClick={() => setIsTopicListExpanded(!isTopicListExpanded)}
                  className="w-full flex items-center justify-between mb-1 hover:opacity-80 transition"
                >
                  <span className="text-[12px] font-medium text-[var(--text-main)]">推荐话题</span>
                  {isTopicListExpanded ? (
                    <ChevronUp size={14} className="text-[var(--text-muted)]" />
                  ) : (
                    <ChevronDown size={14} className="text-[var(--text-muted)]" />
                  )}
                </button>

                {isTopicListExpanded && (
                  <div className="space-y-0.5">
                    {mockTrendingTopics.map(topic => (
                      <button
                        key={topic.id}
                        onClick={() => {
                          insertTopic(topic.name);
                          setShowTopicPicker(false);
                        }}
                        className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-[var(--bg-app)] transition text-left"
                      >
                        <span className="text-[11px] text-[var(--text-main)]">
                          <span className="text-[#FF8A00] mr-1">#</span>
                          {topic.name}
                        </span>
                        <span className="text-[10px] text-[var(--text-dim)] px-1 py-0.5 rounded-full bg-[var(--bg-panel)]">
                          {topic.type === 'polymarket' ? 'Polymarket' : '热点'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 图表选择器 */}
          {showChartPicker && (
            <div className="px-4 pb-3">
              <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-light)]">
                <div className="text-[12px] font-medium text-[var(--text-main)] mb-1">SoSoValue 数据图表</div>
                <div className="space-y-0.5">
                  {mockChartOptions.map(chart => (
                    <button
                      key={chart.id}
                      onClick={() => {
                        setSelectedChart(chart.url);
                        setShowChartPicker(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--bg-app)] transition text-left"
                    >
                      <BarChart3 size={12} className="text-[var(--brand-yellow)]" />
                      <span className="text-[11px] text-[var(--text-main)]">{chart.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="border-t border-[var(--border-light)] px-4 py-3 shrink-0 bg-[var(--bg-panel)]">
          <div className="flex items-center justify-between">
            {/* 左侧：工具图标组 */}
            <div className="flex items-center gap-1">
              {/* 表情 */}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 rounded-lg transition-all hover:bg-[var(--bg-surface)] ${
                  showEmojiPicker ? 'bg-[var(--bg-surface)] text-[var(--brand-yellow)]' : 'text-[var(--text-muted)]'
                }`}
                title="表情"
              >
                <Smile size={18} />
              </button>

              {/* 图片 */}
              <button
                onClick={() => imageInputRef.current?.click()}
                className={`p-2 rounded-lg transition-all hover:bg-[var(--bg-surface)] ${
                  images.length > 0 ? 'bg-[var(--bg-surface)] text-[var(--brand-yellow)]' : 'text-[var(--text-muted)]'
                }`}
                title="图片"
              >
                <ImageIcon size={18} />
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* 视频 */}
              <button
                onClick={() => videoInputRef.current?.click()}
                className={`p-2 rounded-lg transition-all hover:bg-[var(--bg-surface)] ${
                  videos.length > 0 ? 'bg-[var(--bg-surface)] text-[var(--brand-yellow)]' : 'text-[var(--text-muted)]'
                }`}
                title="视频"
              >
                <Video size={18} />
              </button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />

              {/* 分隔线 */}
              <div className="w-px h-4 bg-[var(--border-light)] mx-1" />

              {/* 话题 */}
              <button
                onClick={() => setShowTopicPicker(!showTopicPicker)}
                className={`p-2 rounded-lg transition-all hover:bg-[var(--bg-surface)] ${
                  showTopicPicker || selectedTopics.length > 0 ? 'bg-[var(--bg-surface)] text-[var(--brand-yellow)]' : 'text-[var(--text-muted)]'
                }`}
                title="话题"
              >
                <Hash size={18} />
              </button>

              {/* 图表 */}
              <button
                onClick={() => setShowChartPicker(!showChartPicker)}
                className={`p-2 rounded-lg transition-all hover:bg-[var(--bg-surface)] ${
                  showChartPicker || selectedChart ? 'bg-[var(--bg-surface)] text-[var(--brand-yellow)]' : 'text-[var(--text-muted)]'
                }`}
                title="数据图表"
              >
                <BarChart3 size={18} />
              </button>

              {/* 投票/PK */}
              <button
                onClick={() => setShowPollCreator(!showPollCreator)}
                className={`p-2 rounded-lg transition-all hover:bg-[var(--bg-surface)] ${
                  showPollCreator ? 'bg-[var(--bg-surface)] text-[var(--brand-yellow)]' : 'text-[var(--text-muted)]'
                }`}
                title="投票/PK"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* 右侧：字数统计 + 发布按钮 */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[var(--text-dim)] tabular-nums">
                {content.length} / 10,000
              </span>

              {/* 发布按钮 */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || (!content.trim() && !pollQuestion.trim())}
                className="px-5 py-2 rounded-lg text-[13px] font-semibold bg-[var(--brand-yellow)] text-black hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '发布中...' : '发表'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
