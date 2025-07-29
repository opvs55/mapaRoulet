

import React, { useState, useRef } from 'react';
import { Post, Coordinates, UserProfile } from '../../types/index.ts';
import { generateDescriptionFromImage } from '../../services/geminiService.ts';
import { createPost } from '../../services/posts.ts';
import { CloseIcon, CameraIcon, SendIcon, SparklesIcon, FlameIcon, FoodIcon, MusicIcon, ArtIcon, PartyPopperIcon } from '../ui/Icons.tsx';
import Spinner from '../ui/Spinner.tsx';

interface EventCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
  userLocation: Coordinates;
  user: UserProfile;
}

const eventCategories = [
    { id: 'general', name: 'Geral', icon: <FlameIcon className="w-6 h-6" /> },
    { id: 'party', name: 'Festa', icon: <PartyPopperIcon className="w-6 h-6" /> },
    { id: 'food', name: 'Comida', icon: <FoodIcon className="w-6 h-6" /> },
    { id: 'music', name: 'Música', icon: <MusicIcon className="w-6 h-6" /> },
    { id: 'art', name: 'Arte', icon: <ArtIcon className="w-6 h-6" /> },
];

const EventCreationModal: React.FC<EventCreationModalProps> = ({ isOpen, onClose, onPostCreated, userLocation, user }) => {
  const [description, setDescription] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [fullImageSrc, setFullImageSrc] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [isGeneratingDesc, setGeneratingDesc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFullImageSrc(result);
        const base64String = result.split(',')[1];
        setImageBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateDescription = async () => {
    if (!imageBase64) {
      alert("Por favor, selecione uma imagem primeiro.");
      return;
    }
    setGeneratingDesc(true);
    try {
      const generatedDesc = await generateDescriptionFromImage(imageBase64);
      setDescription(generatedDesc);
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!description || !imageBase64 || !category) {
      alert("Imagem, descrição e categoria são obrigatórias.");
      return;
    }
    setSubmitting(true);
    try {
      // The parent component now handles the logic via the usePosts hook
      const newPost = await createPost({
        userLocation,
        description,
        imageBase64,
        category,
        user
      });
      onPostCreated(newPost);
      resetForm();
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setImageBase64(null);
    setFullImageSrc(null);
    setCategory('');
    if(fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }
  
  const handleClose = () => {
    resetForm();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1100] p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-auto text-white p-6 relative animate-fade-in-up">
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <CloseIcon />
        </button>
        <h2 className="text-2xl font-bold mb-4">Criar novo Rolê</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            {fullImageSrc ? (
              <div className="relative">
                <img src={fullImageSrc} alt="Preview" className="w-full h-48 object-cover rounded-md" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full">
                  <CameraIcon />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-gray-600 rounded-md flex flex-col items-center justify-center text-gray-400 hover:bg-gray-700 hover:border-gray-500"
              >
                <CameraIcon />
                <span className="mt-2">Adicionar Foto</span>
              </button>
            )}
          </div>

          <div className="mb-4 relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que está rolando..."
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-24"
              rows={3}
              required
            ></textarea>
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={!imageBase64 || isGeneratingDesc}
              className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-md text-xs flex items-center disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {isGeneratingDesc ? <Spinner size="sm" /> : <SparklesIcon />}
              <span className="ml-1">Gerar AI</span>
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-bold mb-2">
              Qual é o tipo do rolê?
            </label>
            <div className="flex justify-around items-center bg-gray-700 rounded-lg p-1 sm:p-2">
              {eventCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg w-14 h-14 sm:w-16 sm:h-16 transition-all duration-200 ring-2 ${
                    category === cat.id ? 'ring-blue-500 bg-blue-500 bg-opacity-30 text-white' : 'ring-transparent text-gray-400 hover:bg-gray-600'
                  }`}
                  aria-label={cat.name}
                  title={cat.name}
                >
                  {cat.icon}
                  <span className="text-xs mt-1 font-semibold">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !description || !imageBase64 || !category}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg flex items-center disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Spinner /> : <SendIcon />}
              <span className="ml-2">Postar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventCreationModal;
