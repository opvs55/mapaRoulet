

import React, { useState, useRef } from 'react';
import { UserProfile } from '../../types/index.ts';
import { CloseIcon, CameraIcon } from '../ui/Icons.tsx';
import Spinner from '../ui/Spinner.tsx';

interface EditProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onSave: (username: string, avatarFile: File | null) => Promise<void>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
  const [username, setUsername] = useState(user.username);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === user.username && !avatarFile) {
        onClose();
        return;
    }

    setIsLoading(true);
    setError('');
    try {
      await onSave(username.trim(), avatarFile);
      // Success is handled in App.tsx which will close the modal
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random&color=fff`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[1200] p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl animate-fade-in-up w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <CloseIcon />
        </button>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <img src={avatarPreview || user.avatar_url || fallbackAvatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-gray-700"/>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className="absolute bottom-1 right-1 bg-blue-500 text-white p-1.5 rounded-full hover:bg-blue-600 transition-transform transform hover:scale-110"
                aria-label="Mudar foto de perfil"
              >
                  <CameraIcon className="w-4 h-4"/>
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/jpeg"
            />
            <h2 className="text-2xl font-bold mt-4">Editar Perfil</h2>
          </div>

          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-bold text-gray-300 mb-2 text-left">Nome de usuário</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Seu nome de usuário"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
          <div className="flex justify-end gap-4">
            <button
                type="button"
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
                Cancelar
            </button>
            <button
                type="submit"
                disabled={isLoading || (username.trim() === user.username && !avatarFile)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
            >
                {isLoading ? <Spinner size="md" /> : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;