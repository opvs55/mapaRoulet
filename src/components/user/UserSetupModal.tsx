import React, { useState } from 'react';
import { UserIcon } from '../ui/Icons.tsx';
import Spinner from '../ui/Spinner.tsx';

interface UserSetupModalProps {
  onSetUsername: (username: string) => void;
  initialUsername?: string | null;
}

const UserSetupModal: React.FC<UserSetupModalProps> = ({ onSetUsername, initialUsername }) => {
  const [username, setUsername] = useState(initialUsername || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setIsLoading(true);
      // Simulate a quick save
      setTimeout(() => {
        onSetUsername(username.trim());
        setIsLoading(false);
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[1200] p-4">
      <div className="bg-gray-800 p-8 rounded-2xl text-center shadow-xl animate-fade-in-up w-full max-w-sm">
        <div className="mx-auto bg-blue-500 rounded-full w-16 h-16 flex items-center justify-center mb-4">
          <UserIcon className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Como devemos te chamar?</h2>
        <p className="text-gray-400 mb-6">Escolha um nome de usuário. Ele aparecerá nos seus comentários.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Seu nome de usuário"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || !username.trim()}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg mt-6 text-lg flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? <Spinner size="md" /> : 'Salvar e entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserSetupModal;