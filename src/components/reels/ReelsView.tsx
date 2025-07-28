import React from 'react';
import { Post } from '../../types/index.ts';
import ReelItem from './ReelItem.tsx';
import { CloseIcon } from '../ui/Icons.tsx';

interface ReelsViewProps {
  posts: Post[];
  onClose: () => void;
  onSelectPost: (post: Post) => void;
}

const ReelsView: React.FC<ReelsViewProps> = ({ posts, onClose, onSelectPost }) => {
  return (
    <div className="fixed inset-0 bg-black z-[1200] flex flex-col animate-fade-in-up">
       <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black bg-opacity-60 rounded-full p-2 z-20 hover:bg-opacity-80 transition">
          <CloseIcon />
        </button>
      <div className="reels-container">
        {posts.map((post) => (
          <ReelItem key={post.id} post={post} onSelectPost={onSelectPost} />
        ))}
      </div>
    </div>
  );
};

export default ReelsView;