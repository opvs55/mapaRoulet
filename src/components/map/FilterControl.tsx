import React, { useState } from 'react';
import { FlameIcon, PartyPopperIcon, FoodIcon, MusicIcon, ArtIcon, FilterIcon } from '../ui/Icons.tsx';

const eventCategories = [
    { id: 'general', name: 'Geral', icon: <FlameIcon className="w-5 h-5" /> },
    { id: 'party', name: 'Festa', icon: <PartyPopperIcon className="w-5 h-5" /> },
    { id: 'food', name: 'Comida', icon: <FoodIcon className="w-5 h-5" /> },
    { id: 'music', name: 'Música', icon: <MusicIcon className="w-5 h-5" /> },
    { id: 'art', name: 'Arte', icon: <ArtIcon className="w-5 h-5" /> },
];

interface FilterControlProps {
    activeCategories: string[];
    setActiveCategories: (categories: string[]) => void;
}

const FilterControl: React.FC<FilterControlProps> = ({ activeCategories, setActiveCategories }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggleCategory = (categoryId: string) => {
        const currentlyShowingAll = activeCategories.length === 0;
        let newCategories: string[];

        if (currentlyShowingAll) {
            // If we were showing all, toggling one means we now ONLY show that one.
            newCategories = [categoryId];
        } else {
            newCategories = activeCategories.includes(categoryId)
            ? activeCategories.filter(c => c !== categoryId) // Untoggle
            : [...activeCategories, categoryId]; // Toggle
        }
        
        // If we untoggled the last active category, reset to show all.
        if (newCategories.length === 0) {
            setActiveCategories([]);
        } else {
            setActiveCategories(newCategories);
        }
    };
    
    const handleSelectAll = () => {
        setActiveCategories([]); // Empty array means no filter, i.e., show all.
        setIsOpen(false);
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-gray-800 bg-opacity-75 text-white rounded-full p-3 shadow-lg transition-transform transform hover:scale-110"
                aria-label="Filtrar eventos"
            >
                <FilterIcon />
            </button>
            {isOpen && (
                <div className="absolute top-14 right-0 bg-gray-800 bg-opacity-90 rounded-lg shadow-xl p-3 animate-fade-in-up w-52">
                    <h3 className="text-md font-semibold mb-2 px-1 text-gray-200">Filtrar por Categoria</h3>
                    {eventCategories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleToggleCategory(cat.id)}
                            className={`w-full text-left px-3 py-2 rounded-md mb-1 last:mb-0 text-sm font-medium transition-colors flex items-center gap-3 ${
                                activeCategories.length === 0 || activeCategories.includes(cat.id)
                                    ? 'text-gray-100'
                                    : 'text-gray-500 opacity-60 hover:text-gray-100 hover:opacity-100'
                            }`}
                        >
                            <div className={`${activeCategories.length === 0 || activeCategories.includes(cat.id) ? 'text-blue-400' : ''}`}>
                                {cat.icon}
                            </div>
                            <span>{cat.name}</span>
                        </button>
                    ))}
                    <hr className="border-gray-700 my-2" />
                     <button
                        onClick={handleSelectAll}
                        className="w-full text-center px-3 py-2 rounded-md text-sm font-semibold transition-colors text-blue-400 hover:bg-gray-700"
                    >
                        Mostrar Todos
                    </button>
                </div>
            )}
        </div>
    );
};

export default FilterControl;