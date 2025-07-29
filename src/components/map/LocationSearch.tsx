
import React, { useState } from 'react';
import { SearchIcon } from '../ui/Icons.tsx';
import Spinner from '../ui/Spinner.tsx';

interface LocationSearchProps {
    onSearch: (location: string) => Promise<void>;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ onSearch }) => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setError(null);
        try {
            await onSearch(query);
            setQuery('');
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <form onSubmit={handleSearch} className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (error) setError(null);
                    }}
                    placeholder="Buscar um lugar..."
                    className={`w-full bg-gray-700 text-white placeholder-gray-400 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 ${error ? 'ring-red-500' : 'focus:ring-blue-500'}`}
                    aria-label="Buscar localização"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    {isSearching ? <Spinner size="sm"/> : <SearchIcon className="w-5 h-5" />}
                </div>
            </form>
            {error && <p className="text-red-400 text-xs mt-1 pl-4 text-left">{error}</p>}
        </div>
    );
};

export default LocationSearch;
