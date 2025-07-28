import React from 'react';
import { Post } from '../../types/index.ts';
import { MapIcon, HeartIcon, CommentIcon } from '../ui/Icons.tsx';

interface ReelItemProps {
  post: Post;
  onSelectPost: (post: Post) => void;
}

const ReelItem: React.FC<ReelItemProps> = ({ post, onSelectPost }) => {
  return (
    <div className="reel-item bg-gray-900 flex items-center justify-center">
      <img src={post.imageUrl} alt={post.text} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60"></div>

      <div className="relative z-10 w-full h-full p-4 flex flex-col justify-end text-white">
        <div className="flex items-center gap-3 mb-3">
          <img src={post.author.avatar_url} alt={post.author.username} className="w-10 h-10 rounded-full border-2 border-white"/>
          <span className="font-bold text-lg">{post.author.username}</span>
        </div>
        <p className="text-base mb-4">{post.text}</p>
      </div>
      
      <div className="absolute z-10 right-3 bottom-24 flex flex-col items-center gap-5">
         <div className="flex flex-col items-center text-white">
            <HeartIcon className="w-8 h-8"/>
            <span className="text-sm font-semibold">{post.likes.length}</span>
         </div>
         <div className="flex flex-col items-center text-white">
            <CommentIcon className="w-8 h-8"/>
             <span className="text-sm font-semibold">{post.comments_count}</span>
         </div>
        <button 
            onClick={() => onSelectPost(post)} 
            className="p-3 bg-white bg-opacity-20 rounded-full backdrop-blur-sm hover:bg-opacity-30 transition-all"
            aria-label="Ver no mapa"
        >
          <MapIcon className="w-8 h-8 text-white"/>
        </button>
      </div>
    </div>
  );
};

export default ReelItem;