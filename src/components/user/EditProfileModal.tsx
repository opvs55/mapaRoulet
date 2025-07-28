import React, { useState } from 'react';
import { UserProfile } from '../../types/index.ts';
import { CloseIcon, UserIcon } from '../ui/Icons.tsx';
import Spinner from '../ui/Spinner.tsx';

interface EditProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onSave: (username: string) => Promise<void>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
  const [username, setUsername] = useState(user.username);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || username.trim() === user.username) {
        onClose();
        return;
    }

    setIsLoading(true);
    setError('');
    try {
      await onSave(username.trim());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[1200] p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl animate-fade-in-up w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <CloseIcon />
        </button>
        <div className="text-center">
            <div className="mx-auto bg-blue-500 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <UserIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Editar Perfil</h2>
            <p className="text-gray-400 mb-6">Atualize seu nome de usuário.</p>
        </div>
        <form onSubmit={handleSubmit}>
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
              autoFocus
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
                disabled={isLoading || !username.trim()}
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
