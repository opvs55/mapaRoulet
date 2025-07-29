import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Post, Coordinates } from './types/index.ts';
import MapView from './components/map/MapView.tsx';
import EventCreationModal from './components/event/EventCreationModal.tsx';
import EventDetailsModal from './components/event/EventDetailsModal.tsx';
import Onboarding from './components/onboarding/Onboarding.tsx';
import LocationSearch from './components/map/LocationSearch.tsx';
import FilterControl from './components/map/FilterControl.tsx';
import useGeolocation from './hooks/useGeolocation.ts';
import { PlusIcon, LayersIcon, ReelsIcon, CloseIcon, RefreshIcon, LogoIcon } from './components/ui/Icons.tsx';
import { getCoordinatesForLocation } from './services/geminiService.ts';
import { updateUserProfile } from './services/profile.ts';
import { useAuth } from './hooks/useAuth.ts';
import { usePosts } from './hooks/usePosts.ts';
import Spinner from './components/ui/Spinner.tsx';
import LoginPage from './components/auth/LoginPage.tsx';
import ReelsView from './components/reels/ReelsView.tsx';
import UserProfilePage from './components/user/UserProfilePage.tsx';
import EditProfileModal from './components/user/EditProfileModal.tsx';
import LocationBanner from './components/ui/LocationBanner.tsx';

const mapStyles = {
  dark: {
    name: 'Escuro',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  street: {
    name: 'Ruas',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  satellite: {
    name: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }
};

const App: React.FC = () => {
  const { session, userProfile, setUserProfile, isLoading: isAuthLoading, signOut, deleteAccount } = useAuth();
  const { 
    posts, 
    setPosts, 
    selectedPost, 
    setSelectedPost, 
    isRefreshing, 
    fetchError, 
    setFetchError,
    fetchAndSetPosts,
    handlePostCreated,
    handleDeletePost,
    handleLikePost,
    handleAddComment,
    handleDeleteComment 
  } = usePosts();

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isEditProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const { location, error: geoError, requestLocation } = useGeolocation();
  const [currentMapStyleKey, setCurrentMapStyleKey] = useState('dark');
  const [isStyleSwitcherOpen, setStyleSwitcherOpen] = useState(false);
  const [isReelsOpen, setReelsOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [showLocationBanner, setShowLocationBanner] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const defaultCenter: Coordinates = { lat: -23.55052, lng: -46.633308 }; // São Paulo
  const [mapCenter, setMapCenter] = useState<Coordinates>(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  
  const mapMoveDebounceTimeout = useRef<number | null>(null);

  const handleProfileUpdate = async (newUsername: string, avatarFile: File | null) => {
    if (!userProfile) return;
    try {
      const updatedProfile = await updateUserProfile(userProfile.id, newUsername, avatarFile);
      setUserProfile(updatedProfile);
      // Update posts authored by the user to reflect new profile data
      setPosts(currentPosts => currentPosts.map(p => {
        if (p.author.id === updatedProfile.id) {
          return { ...p, author: updatedProfile };
        }
        return p;
      }));
      setEditProfileModalOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      // Re-throw so the modal's catch block can handle the UI update
      throw error;
    }
  };
  
  // Handles auth side-effects like showing onboarding
  useEffect(() => {
    if (session && !isAuthLoading) {
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [session, isAuthLoading]);

  // Request location once on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Handles the one-time initial fetch after geolocation is resolved
  useEffect(() => {
    if (!session || !isInitialLoad) return;
    
    const isGeoSettled = location || geoError;

    if (isGeoSettled) {
        const initialCenter = location || defaultCenter;
        setMapCenter(initialCenter);
        fetchAndSetPosts(initialCenter, true);
        setIsInitialLoad(false); // Mark initial load as complete
    }
  }, [location, geoError, session, isInitialLoad, fetchAndSetPosts, defaultCenter]);

  const filteredPosts = useMemo(() => {
    if (activeCategories.length === 0) {
      return posts;
    }
    return posts.filter(post => activeCategories.includes(post.category));
  }, [posts, activeCategories]);

  const handleLocationSearch = async (locationName: string) => {
    try {
        const coords = await getCoordinatesForLocation(locationName);
        setMapCenter(coords);
        setMapZoom(15);
    } catch (error) {
        console.error(error);
        throw error;
    }
  }

  const handleMapMoveEnd = useCallback((newCenter: Coordinates, newZoom: number) => {
    setMapCenter(newCenter);
    setMapZoom(newZoom);

    if (mapMoveDebounceTimeout.current) {
        clearTimeout(mapMoveDebounceTimeout.current);
    }
    
    mapMoveDebounceTimeout.current = window.setTimeout(() => {
        fetchAndSetPosts(newCenter, false);
    }, 1500); // 1.5 second debounce after map stops moving

  }, [fetchAndSetPosts]);

  const handleSelectPostFromAnywhere = useCallback((post: Post) => {
    setProfileOpen(false);
    setReelsOpen(false);
    setMapCenter(post.coordinates);
    setMapZoom(15);
    setSelectedPost(post);
  }, [setSelectedPost]);

  const handleDeleteAccount = useCallback(async () => {
    if (!userProfile) return;
    try {
      await deleteAccount();
    } catch (error) {
      console.error("Failed to delete account:", error);
      alert((error as Error).message);
    }
  }, [userProfile, deleteAccount]);
  
  const handleManualRefresh = () => {
    if (mapMoveDebounceTimeout.current) {
      clearTimeout(mapMoveDebounceTimeout.current);
    }
    fetchAndSetPosts(mapCenter, false);
  };

  const handleCloseDetails = useCallback(() => {
    setSelectedPost(null);
  }, [setSelectedPost]);

  const displayedPost = useMemo(() => {
      if (!selectedPost) return null;
      // Find the most up-to-date version of the post from the list
      // to ensure the modal has the freshest data.
      return posts.find(p => p.id === selectedPost.id) || selectedPost;
  }, [posts, selectedPost]);
  
  if (isAuthLoading) {
      return (
          <div className="w-full h-full bg-gray-900 text-white flex flex-col items-center justify-center">
              <Spinner size="lg" />
              <p className="mt-4 text-lg">Carregando...</p>
          </div>
      );
  }

  if (!session) {
      return <LoginPage />;
  }

  if (showOnboarding) {
    return <Onboarding onComplete={() => {
        localStorage.setItem('hasSeenOnboarding', 'true');
        setShowOnboarding(false);
    }} />;
  }

  return (
    <div className="w-screen h-screen bg-gray-900 text-white flex flex-col">
      <header className="shrink-0 bg-black bg-opacity-75 p-3 sm:p-4 flex items-center justify-between z-20 shadow-lg gap-2 sm:gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <LogoIcon className="w-8 h-8 text-blue-400" />
          <h1 className="hidden sm:block text-xl font-bold tracking-wider text-left">Radar Urbano</h1>
        </div>
        <div className="flex-1 min-w-0 flex justify-center px-1 sm:px-2">
            <LocationSearch onSearch={handleLocationSearch} />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => setReelsOpen(true)} className="p-2 text-gray-300 hover:text-white transition-colors" aria-label="Ver Reels">
            <ReelsIcon className="w-6 h-6"/>
          </button>
            {userProfile && (
              <button onClick={() => setProfileOpen(true)} className="flex items-center gap-2 shrink-0 p-1 rounded-full hover:bg-gray-700 transition-colors">
                  <img src={userProfile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.username)}&background=random`} alt="User Avatar" className="w-8 h-8 rounded-full"/>
                  <span className="hidden md:inline text-gray-300 text-sm font-semibold pr-2">{userProfile.username.split(' ')[0]}</span>
              </button>
            )}
        </div>
      </header>
      
      <main className="flex-grow relative z-0">
        {isInitialLoad && posts.length === 0 && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex flex-col items-center justify-center z-10">
            <Spinner size="lg" />
            <p className="mt-4 text-lg">Buscando rolês perto de você...</p>
          </div>
        )}
         {fetchError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-800 border border-red-600 text-white p-3 rounded-lg shadow-lg z-[1001] flex items-center gap-4 animate-fade-in-up w-11/12 max-w-md">
            <div className="flex-grow">
                <p className="font-bold">Erro ao buscar rolês</p>
                <p className="text-sm text-red-200">{fetchError}</p>
            </div>
            <button onClick={() => setFetchError(null)} className="p-1 rounded-full hover:bg-red-700">
                <CloseIcon />
            </button>
          </div>
        )}
        <MapView
          posts={filteredPosts}
          onMarkerClick={handleSelectPostFromAnywhere}
          center={mapCenter}
          zoom={mapZoom}
          userLocation={location}
          mapStyle={mapStyles[currentMapStyleKey]}
          onMoveEnd={handleMapMoveEnd}
        />
        
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <FilterControl activeCategories={activeCategories} setActiveCategories={setActiveCategories} />
            <div className="relative">
                <button
                    onClick={() => setStyleSwitcherOpen(!isStyleSwitcherOpen)}
                    className="bg-gray-800 bg-opacity-75 text-white rounded-full p-3 shadow-lg transition-transform transform hover:scale-110"
                    aria-label="Mudar estilo do mapa"
                >
                    <LayersIcon />
                </button>
                {isStyleSwitcherOpen && (
                    <div className="absolute top-14 right-0 bg-gray-800 bg-opacity-90 rounded-lg shadow-xl p-2 animate-fade-in-up w-36">
                    {Object.entries(mapStyles).map(([key, style]) => (
                        <button
                        key={key}
                        onClick={() => {
                            setCurrentMapStyleKey(key);
                            setStyleSwitcherOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md mb-1 last:mb-0 text-sm font-semibold transition-colors ${
                            currentMapStyleKey === key
                            ? 'bg-blue-500 text-white'
                            : 'hover:bg-gray-700 text-gray-200'
                        }`}
                        >
                        {style.name}
                        </button>
                    ))}
                    </div>
                )}
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="bg-gray-800 bg-opacity-75 text-white rounded-full p-3 shadow-lg transition-transform transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Atualizar rolês na área"
            >
              {isRefreshing ? <Spinner size="sm" /> : <RefreshIcon className="w-5 h-5"/>}
            </button>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="absolute bottom-24 sm:bottom-8 right-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 z-[1000]"
          aria-label="Criar novo post"
        >
          <PlusIcon />
        </button>
        
        {!location && showLocationBanner && (
           <LocationBanner onDismiss={() => setShowLocationBanner(false)} onActionClick={requestLocation}/>
        )}

      </main>

      {displayedPost && userProfile && (
        <EventDetailsModal 
          post={displayedPost} 
          onClose={handleCloseDetails}
          onAddComment={handleAddComment}
          onLike={handleLikePost}
          onDeleteComment={handleDeleteComment}
          currentUser={userProfile}
        />
      )}
      
      {isCreateModalOpen && location && userProfile && (
        <EventCreationModal
          isOpen={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onPostCreated={(newPost) => {
            handlePostCreated(newPost);
            setCreateModalOpen(false);
            handleSelectPostFromAnywhere(newPost);
          }}
          userLocation={location}
          user={userProfile}
        />
      )}
      
      {isCreateModalOpen && !location && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1100] p-4" onClick={() => setCreateModalOpen(false)}>
           <div className="bg-gray-800 p-8 rounded-lg text-center shadow-xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">Localização Necessária</h3>
              <p className="text-lg mb-2">Não conseguimos acessar sua localização.</p>
              <p className="text-sm text-gray-400 mb-6">Para criar um rolê, precisamos saber onde você está. Por favor, habilite a permissão de localização no seu navegador e tente novamente.</p>
              {geoError && <p className="text-red-400 text-sm my-2">{geoError}</p>}
              <div className="flex justify-center gap-4">
                  <button onClick={() => setCreateModalOpen(false)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold px-6 py-2 rounded-lg">Fechar</button>
                  <button onClick={requestLocation} className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-2 rounded-lg">Tentar Novamente</button>
              </div>
           </div>
        </div>
      )}

      {isReelsOpen && (
        <ReelsView 
          posts={posts}
          onClose={() => setReelsOpen(false)}
          onSelectPost={handleSelectPostFromAnywhere}
        />
      )}

      {isProfileOpen && userProfile && (
        <UserProfilePage
          user={userProfile}
          allPosts={posts}
          onClose={() => setProfileOpen(false)}
          onSelectPost={handleSelectPostFromAnywhere}
          onLogout={signOut}
          onDeletePost={(postId) => {
            handleDeletePost(postId);
            setProfileOpen(false);
          }}
          onDeleteAccount={handleDeleteAccount}
          onEditProfile={() => setEditProfileModalOpen(true)}
        />
      )}
      
      {isEditProfileModalOpen && userProfile && (
        <EditProfileModal
            user={userProfile}
            onClose={() => setEditProfileModalOpen(false)}
            onSave={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default App;