import { useState, useRef, useEffect } from 'react';
import { X, Home, TrendingUp, Users, Eye, PenSquare } from 'lucide-react';
import { HomePage } from './HomePage';
import { FollowingPage } from './FollowingPage';
import { PositionsPage } from './PositionsPage';
import { UserProfilePage } from './UserProfilePage';
import { PostEditor, type PostData } from './PostEditor';
import { mockPosts, mockCurrentUser } from '../../data/mockCommunity';
import type { Post } from '../../types/community';
import { createPost } from '../../services/communityApi';

interface CommunityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentSymbol?: string;
}

export function CommunityPanel({ isOpen, onClose, currentSymbol }: CommunityPanelProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeLeftNav, setActiveLeftNav] = useState<'home' | 'positions' | 'following' | 'publish' | 'profile'>('home');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [showMyProfile, setShowMyProfile] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // 拖拽逻辑
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
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

  // 处理点赞
  const handleLike = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
          };
        }
        return post;
      })
    );
  };

  // 处理评论
  const handleComment = (postId: string) => {
    console.log('Comment on post:', postId);
    // TODO: 打开评论弹窗
  };

  // 处理分享
  const handleShare = (postId: string) => {
    console.log('Share post:', postId);
    // TODO: 实现分享逻辑
  };

  // 处理关注
  const handleFollow = (userId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.user.id === userId) {
          return {
            ...post,
            user: {
              ...post.user,
              isFollowing: !post.user.isFollowing,
              followerCount: post.user.isFollowing
                ? post.user.followerCount - 1
                : post.user.followerCount + 1,
            },
          };
        }
        return post;
      })
    );
  };

  // 处理发帖
  const handlePublishPost = async (postData: PostData) => {
    try {
      const result = await createPost(postData);

      if (result.success && result.post) {
        // 构建新帖子对象
        const newPost: Post = {
          id: result.post.id,
          userId: result.post.userId,
          user: {
            id: result.post.userId,
            username: '我',
            avatar: '/placeholder-avatar.png', // TODO: 使用真实用户头像
            isVerified: false,
            isFollowing: false,
            followerCount: 0,
            followingCount: 0,
            postCount: 0,
          },
          content: result.post.content,
          images: result.post.images,
          attachments: [],
          createdAt: result.post.createdAt,
          viewCount: result.post.viewCount,
          likeCount: result.post.likeCount,
          commentCount: result.post.commentCount,
          shareCount: result.post.shareCount,
          isLiked: result.post.isLiked,
          type: 'feed',
          tags: result.post.tags,
        };

        // 如果有投票或PK，添加到attachments
        if (result.post.poll) {
          const poll = result.post.poll;
          if (poll.options.length === 2) {
            // PK模式
            newPost.attachments?.push({
              id: `pk_${Math.random().toString(36).substr(2, 9)}`,
              type: 'pk',
              pk: {
                id: `pk_${Math.random().toString(36).substr(2, 9)}`,
                question: poll.question,
                leftOption: {
                  text: poll.options[0],
                  percentage: 50,
                  votes: 0,
                },
                rightOption: {
                  text: poll.options[1],
                  percentage: 50,
                  votes: 0,
                },
                totalVotes: 0,
                endTime: poll.endDate,
              },
            });
          } else {
            // 投票模式
            newPost.attachments?.push({
              id: `poll_${Math.random().toString(36).substr(2, 9)}`,
              type: 'poll',
              poll: {
                id: `poll_${Math.random().toString(36).substr(2, 9)}`,
                question: poll.question,
                options: poll.options.map(opt => ({
                  id: `opt_${Math.random().toString(36).substr(2, 9)}`,
                  text: opt,
                  votes: 0,
                  percentage: 0,
                })),
                totalVotes: 0,
                endTime: poll.endDate,
                pollType: poll.type === 'single' ? 'single' : 'yesno',
              },
            });
          }
        }

        // 将新帖子添加到列表顶部
        setPosts(prevPosts => [newPost, ...prevPosts]);

        // 切换到主页查看新帖子
        setActiveLeftNav('home');
      }
    } catch (error) {
      console.error('发布失败:', error);
      throw error;
    }
  };

  // 点击外部关闭面板（PostEditor 打开时不触发）
  useEffect(() => {
    if (!isOpen || isEditorOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isEditorOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed z-[300] glass-panel rounded-2xl overflow-hidden shadow-2xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '450px',
        height: '620px',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header - 可拖拽标题栏 */}
      <div className="drag-handle h-12 bg-[var(--bg-panel)] border-b border-[var(--border-light)] flex items-center justify-between px-4 cursor-move">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-[var(--brand-yellow)]" />
          <span className="text-[15px] font-bold text-[var(--text-main)]">社区</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition hover:bg-[var(--bg-surface)] cursor-pointer"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <X size={16} className="text-[var(--text-muted)] hover:text-[var(--text-main)]" />
          </button>
        </div>
      </div>

      {/* Main Content - 左右布局 */}
      <div className="flex h-[calc(100%-48px)] bg-[var(--bg-app)]">
        {/* 左侧导航栏 */}
        <div className="w-20 bg-[var(--bg-panel)] border-r border-[var(--border-light)] flex flex-col items-center py-6 gap-6">
          {/* 用户头像 - 可点击进入个人主页 */}
          <button
            onClick={() => setShowMyProfile(true)}
            className="w-12 h-12 rounded-full overflow-hidden hover:ring-2 hover:ring-[var(--brand-yellow)] transition cursor-pointer"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <img
              src={mockCurrentUser.avatar}
              alt={mockCurrentUser.username}
              className="w-full h-full object-cover"
            />
          </button>

          {/* 导航按钮 */}
          <button
            onClick={() => {
              setShowMyProfile(false);
              setActiveLeftNav('home');
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${
              !showMyProfile && activeLeftNav === 'home'
                ? 'bg-[var(--bg-surface)] text-[var(--brand-yellow)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
            }`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Home size={20} />
            <span className="text-[10px] font-medium">主页</span>
          </button>

          <button
            onClick={() => {
              setShowMyProfile(false);
              setActiveLeftNav('positions');
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${
              !showMyProfile && activeLeftNav === 'positions'
                ? 'bg-[var(--bg-surface)] text-[var(--brand-yellow)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
            }`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <TrendingUp size={20} />
            <span className="text-[10px] font-medium">持仓日报</span>
          </button>

          <button
            onClick={() => {
              setShowMyProfile(false);
              setActiveLeftNav('following');
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${
              !showMyProfile && activeLeftNav === 'following'
                ? 'bg-[var(--bg-surface)] text-[var(--brand-yellow)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
            }`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Eye size={20} />
            <span className="text-[10px] font-medium">我的关注</span>
          </button>

          <button
            onClick={() => {
              setShowMyProfile(false);
              setIsEditorOpen(true);
            }}
            className="flex flex-col items-center gap-1 p-2 rounded-lg transition text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <PenSquare size={20} />
            <span className="text-[10px] font-medium">发布</span>
          </button>
        </div>

        {/* 右侧内容区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 我的个人主页 */}
          {showMyProfile && (
            <UserProfilePage
              user={mockCurrentUser}
              posts={posts}
              isCurrentUser={true}
              onClose={() => setShowMyProfile(false)}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onFollow={handleFollow}
              onPostClick={(postId) => {
                // 点击帖子时可以扩展逻辑
                console.log('Post clicked:', postId);
              }}
            />
          )}

          {!showMyProfile && activeLeftNav === 'home' && (
            <HomePage
              posts={posts}
              currentSymbol={currentSymbol}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onFollow={handleFollow}
            />
          )}

          {!showMyProfile && activeLeftNav === 'following' && (
            <FollowingPage
              posts={posts}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onFollow={handleFollow}
            />
          )}

          {!showMyProfile && activeLeftNav === 'positions' && (
            <PositionsPage
              posts={posts}
              currentSymbol={currentSymbol}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onFollow={handleFollow}
            />
          )}

          {!showMyProfile && activeLeftNav === 'publish' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users size={64} className="text-[var(--text-dim)] mx-auto mb-4" />
                <p className="text-[var(--text-muted)] text-sm">发布功能正在开发中...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PostEditor */}
      <PostEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSubmit={handlePublishPost}
      />
    </div>
  );
}
