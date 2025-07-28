import React from 'react';
import { CloseIcon } from './Icons.tsx';

interface LocationBannerProps {
  onDismiss: () => void;
  onActionClick: () => void;
}

const LocationBanner: React.FC<LocationBannerProps> = ({ onDismiss, onActionClick }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-blue-900 bg-opacity-95 text-white p-3 flex items-center justify-between z-[1000] animate-fade-in-up">
        <div className="flex-grow text-center sm:text-left">
            <p className="font-semibold text-sm">
                Para uma melhor experiência, ative sua localização.
            </p>
            <p className="text-xs text-blue-200 hidden sm:block">
                Mostraremos os rolês que estão bombando perto de você!
            </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
            <button
                onClick={onActionClick}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-1.5 text-sm rounded-lg transition-colors"
            >
                Ativar
            </button>
            <button onClick={onDismiss} className="p-1 text-blue-200 hover:text-white">
                <CloseIcon />
            </button>
        </div>
    </div>
  );
};

export default LocationBanner;
