



import React, { useState, useEffect, useRef } from 'react';
import { Post, Comment, UserProfile } from '../../types/index.ts';
import { CloseIcon, HeartIcon, CommentIcon, ShareIcon, SendIcon, TrashIcon } from '../ui/Icons.tsx';
import { timeSince } from '../../utils/date.ts';

interface EventDetailsModalProps {
  post: Post;
  onClose: () => void;
  onAddComment: (postId: string, commentText: string) => void;
  onLike: (postId: string) => void;
  onDeleteComment: (commentId: string, postId: string) => void;
  currentUser: UserProfile | null;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ post, onClose, onAddComment, onLike, onDeleteComment, currentUser }) => {
  const [commentText, setCommentText] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only scroll to bottom if there are new comments.
    // This check prevents scrolling on initial load.
    const timer = setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
    return () => clearTimeout(timer);
  }, [post.comments.length]);

  const handleLikeClick = () => {
    if (!currentUser) {
      alert("Você precisa estar logado para curtir.");
      return;
    }
    onLike(post.id);
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Você precisa estar logado para comentar.");
      return;
    }
    if (commentText.trim()) {
      onAddComment(post.id, commentText);
      setCommentText('');
    }
  };
  
  const AuthorInfo: React.FC<{author: UserProfile, timestamp: Date}> = ({author, timestamp}) => (
    <div className="flex items-center gap-2 mb-2">
        <img src={author.avatar_url} alt={author.username} className="w-8 h-8 rounded-full bg-gray-700"/>
        <div>
            <p className="font-semibold text-sm text-gray-200">{author.username}</p>
            <p className="text-gray-400 text-xs">{timeSince(timestamp)}</p>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[1100]" onClick={onClose}>
      <div 
        className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-lg h-full max-h-[90vh] text-white flex flex-col relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-white bg-black bg-opacity-60 rounded-full p-2 z-20 hover:bg-opacity-80 transition">
          <CloseIcon />
        </button>
        
        <div className="flex-shrink-0">
          <img src={post.imageUrl} alt="Post image" className="w-full h-72 object-cover rounded-t-lg" />
        </div>

        <div className="flex flex-col flex-grow p-4 overflow-y-hidden">
          <div className="flex-shrink-0">
             <AuthorInfo author={post.author} timestamp={post.timestamp}/>
             <p className="mb-4">{post.text}</p>
             <div className="flex items-center space-x-6 mb-4">
                <button onClick={handleLikeClick} className="flex items-center space-x-2 text-gray-300 hover:text-white transition group disabled:cursor-not-allowed" disabled={!currentUser}>
                   <HeartIcon className={`h-7 w-7 transition-colors ${post.isLiked ? 'text-red-500' : ''} group-hover:text-red-400`} isFilled={post.isLiked} />
                   <span>{post.likes.length}</span>
                </button>
                <div className="flex items-center space-x-2 text-gray-300">
                   <CommentIcon className="h-7 w-7" />
                   <span>{post.comments_count}</span>
                </div>
                <button className="flex items-center space-x-2 text-gray-300 hover:text-white transition">
                   <ShareIcon className="h-7 w-7" />
                </button>
             </div>
             <hr className="border-gray-700"/>
          </div>

          <div className="flex-grow overflow-y-auto py-4 comment-scrollbar">
            {post.comments.map(comment => (
              <div key={comment.id} className="flex items-start space-x-3 mb-4 group">
                <img src={comment.author.avatar_url} alt={comment.author.username} className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0"/>
                <div className="flex-grow">
                  <p>
                    <span className="font-semibold text-gray-200">{comment.author.username}</span>
                    <span className="text-gray-400 text-xs ml-2">{timeSince(comment.timestamp)}</span>
                  </p>
                  <p className="text-gray-300">{comment.text}</p>
                </div>
                {currentUser && currentUser.id === comment.user_id && (
                    <button 
                        onClick={() => onDeleteComment(comment.id, post.id)} 
                        className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Deletar comentário"
                    >
                        <TrashIcon className="w-4 h-4"/>
                    </button>
                )}
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>
          
          <div className="flex-shrink-0 pt-2">
            <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={currentUser ? "Adicione um comentário..." : "Faça login para comentar"}
                className="w-full bg-gray-700 border-2 border-transparent rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!currentUser}
              />
              <button type="submit" className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 disabled:bg-gray-500" disabled={!commentText.trim() || !currentUser}>
                <SendIcon />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EventDetailsModal);