import React, { useMemo } from 'react';
import { Post, UserProfile } from '../../types/index.ts';
import { CloseIcon, TrashIcon } from '../ui/Icons.tsx';

interface UserProfilePageProps {
  user: UserProfile;
  allPosts: Post[];
  onClose: () => void;
  onSelectPost: (post: Post) => void;
  onLogout: () => void;
  onDeletePost: (postId: string) => void;
  onDeleteAccount: () => void;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ user, allPosts, onClose, onSelectPost, onLogout, onDeletePost, onDeleteAccount }) => {

  const userPosts = useMemo(() => {
    return allPosts.filter(post => post.author.id === user.id);
  }, [allPosts, user.id]);
  
  const handleDeleteClick = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation(); // Prevent the post from opening when clicking delete
    if(window.confirm("Tem certeza que quer apagar este rolê? Esta ação não pode ser desfeita.")){
        onDeletePost(postId);
    }
  }
  
  const handleAccountDelete = () => {
    if(window.confirm("ATENÇÃO: Você tem certeza que quer deletar sua conta? Todos os seus posts, comentários e curtidas serão apagados permanentemente. Esta ação não pode ser desfeita.")){
      onDeleteAccount();
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[1200]" onClick={onClose}>
      <div 
        className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl h-full max-h-[85vh] text-white flex flex-col relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-white bg-black bg-opacity-60 rounded-full p-2 z-20 hover:bg-opacity-80 transition">
          <CloseIcon />
        </button>
        
        <div className="p-6 flex flex-col items-center border-b border-gray-700">
          <img src={user.avatar_url} alt={user.username} className="w-24 h-24 rounded-full mb-4 border-4 border-gray-700"/>
          <h2 className="text-2xl font-bold">{user.username}</h2>
          <p className="text-gray-400">{userPosts.length} Rolês Criados</p>
          <div className="flex items-center gap-4 mt-4">
            <button 
              onClick={onLogout}
              className="bg-gray-600 hover:bg-gray-500 text-white font-bold px-4 py-2 text-sm rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </div>

        <div className="flex-grow p-4 overflow-y-auto comment-scrollbar">
            <h3 className="text-lg font-semibold text-gray-300 mb-4 px-2">Meus Rolês</h3>
            {userPosts.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {userPosts.map(post => (
                        <div 
                            key={post.id} 
                            className="relative aspect-square bg-gray-800 rounded-md overflow-hidden cursor-pointer group"
                            onClick={() => onSelectPost(post)}
                        >
                            <img 
                                src={post.imageUrl} 
                                alt={post.text}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300"></div>
                            <button 
                                onClick={(e) => handleDeleteClick(e, post.id)}
                                className="absolute top-1 right-1 bg-red-600 bg-opacity-80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-100"
                                aria-label="Deletar post"
                            >
                                <TrashIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500 mt-10">Você ainda não criou nenhum rolê. Que tal começar agora?</p>
            )}
        </div>
         <div className="p-4 border-t border-gray-700 text-center">
             <button
                onClick={handleAccountDelete}
                className="text-sm text-red-500 hover:text-red-400 hover:underline"
            >
                Deletar minha conta permanentemente
            </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;