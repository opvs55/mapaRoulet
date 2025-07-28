import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Post, Coordinates, Comment, UserProfile } from './types/index.ts';
import MapView from './components/map/MapView.tsx';
import EventCreationModal from './components/event/EventCreationModal.tsx';
import EventDetailsModal from './components/event/EventDetailsModal.tsx';
import Onboarding from './components/onboarding/Onboarding.tsx';
import LocationSearch from './components/map/LocationSearch.tsx';
import FilterControl from './components/map/FilterControl.tsx';
import useGeolocation from './hooks/useGeolocation.ts';
import { PlusIcon, LayersIcon, ReelsIcon } from './components/ui/Icons.tsx';
import { getCoordinatesForLocation } from './services/geminiService.ts';
import { 
    getPosts, 
    onAuthStateChange, 
    signOut, 
    deletePost as deletePostService,
    addComment as addCommentService,
    deleteComment as deleteCommentService,
    likePost as likePostService,
    unlikePost as unlikePostService,
    updateUserProfileUsername,
    deleteCurrentUserAccount
} from './services/supabaseService.ts';
import Spinner from './components/ui/Spinner.tsx';
import { Session } from '@supabase/supabase-js';
import LoginPage from './components/auth/LoginPage.tsx';
import ReelsView from './components/reels/ReelsView.tsx';
import UserProfilePage from './components/user/UserProfilePage.tsx';
import UserSetupModal from './components/user/UserSetupModal.tsx';

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showUserSetup, setShowUserSetup] = useState(false);
  const { location, error: geoError, requestLocation } = useGeolocation();
  const [currentMapStyleKey, setCurrentMapStyleKey] = useState('dark');
  const [isStyleSwitcherOpen, setStyleSwitcherOpen] = useState(false);
  const [isReelsOpen, setReelsOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);

  const defaultCenter: Coordinates = { lat: -23.55052, lng: -46.633308 }; // São Paulo
  const [mapCenter, setMapCenter] = useState<Coordinates>(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  
  const fetchAndSetPosts = async () => {
      try {
        const fetchedPosts = await getPosts();
        setPosts(fetchedPosts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
      } catch (error) {
        console.error(error);
        // Optionally, set an error state to show a message to the user
      } finally {
        setIsLoading(false);
      }
  }
  
    const handleSetUsername = async (newUsername: string) => {
      if (!session?.user) return;
      try {
        const updatedProfile = await updateUserProfileUsername(session.user.id, newUsername);
        setUserProfile(updatedProfile);
        setShowUserSetup(false);
      } catch (error) {
        console.error("Error updating username:", error);
        // You could show an error message in the modal here
      }
    };

  useEffect(() => {
    const { data: authListener } = onAuthStateChange((_event, session) => {
      setSession(session);
      
      if (session) {
        const profile = session?.user?.user_metadata as UserProfile | null;
        setUserProfile(profile);
        const username = profile?.username;
        const isDefaultUsername = username === session.user.email?.split('@')[0];
        
        if (!username || isDefaultUsername) {
            setShowUserSetup(true);
        } else {
            setShowUserSetup(false);
        }

        // Update posts with correct like status when user changes
        setPosts(currentPosts => currentPosts.map(p => ({
            ...p,
            isLiked: profile ? p.likes.includes(profile.id) : false,
        })));

        if (_event === 'SIGNED_IN') {
          fetchAndSetPosts(); // refetch posts on sign in
          const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
          if (!hasSeenOnboarding) {
            setShowOnboarding(true);
          }
        }
      } else {
         setUserProfile(null);
         setShowUserSetup(false);
         setPosts([]); // Clear posts on sign out
      }
    });
    
    setIsLoading(true);
    fetchAndSetPosts();
    requestLocation();

    return () => {
      authListener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (location) {
        setMapCenter(location);
    }
  }, [location]);

  const filteredPosts = useMemo(() => {
    if (activeCategories.length === 0) {
      return posts;
    }
    return posts.filter(post => activeCategories.includes(post.category));
  }, [posts, activeCategories]);

  const handlePostCreated = (newPost: Post) => {
    setPosts(prevPosts => [newPost, ...prevPosts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    setCreateModalOpen(false);
  };

  const handleAddComment = useCallback(async (postId: string, commentText: string) => {
    if (!userProfile) return;
    try {
        const newComment = await addCommentService(postId, commentText, userProfile);

        const updatePostState = (prev: Post | null) => prev ? {
            ...prev,
            comments: [...prev.comments, newComment],
            comments_count: prev.comments_count + 1
        } : null;
        
        setSelectedPost(updatePostState);
        setPosts(prevPosts => prevPosts.map(p => p.id === postId ? updatePostState(p) as Post : p));

    } catch(error) {
        console.error("Failed to add comment:", error);
    }
  }, [userProfile]);


  const handleLikePost = useCallback(async (postId: string) => {
     if (!userProfile) return;
     
     const post = posts.find(p => p.id === postId);
     if (!post) return;

     const currentlyLiked = post.isLiked;
     const newLikedState = !currentlyLiked;

     // Optimistic update
     const updatePostState = (p: Post) => ({
        ...p,
        isLiked: newLikedState,
        likes: newLikedState ? [...p.likes, userProfile.id] : p.likes.filter(id => id !== userProfile.id),
     });
     setPosts(currentPosts => currentPosts.map(p => p.id === postId ? updatePostState(p) : p));
     if(selectedPost?.id === postId) {
         setSelectedPost(p => p ? updatePostState(p) : null);
     }
     
     try {
        if (newLikedState) {
            await likePostService(postId, userProfile.id);
        } else {
            await unlikePostService(postId, userProfile.id);
        }
     } catch (error) {
        // Revert on error
         console.error("Failed to update like:", error);
         const revertPostState = (p: Post) => ({
            ...p,
            isLiked: currentlyLiked,
            likes: post.likes,
         });
         setPosts(currentPosts => currentPosts.map(p => p.id === postId ? revertPostState(p) : p));
         if(selectedPost?.id === postId) {
            setSelectedPost(p => p ? revertPostState(p) : null);
         }
     }
  }, [userProfile, posts, selectedPost]);

  const handleDeletePost = useCallback(async (postId: string) => {
    const originalPosts = posts;
    setPosts(prev => prev.filter(p => p.id !== postId));
    setSelectedPost(null);
    setProfileOpen(false);

    try {
        await deletePostService(postId);
    } catch(error) {
        console.error("Failed to delete post:", error);
        setPosts(originalPosts); // Revert on error
    }
  }, [posts]);

  const handleDeleteComment = useCallback(async (commentId: string, postId: string) => {
    const updatePostState = (p: Post) => ({
        ...p,
        comments: p.comments.filter(c => c.id !== commentId),
        comments_count: p.comments_count - 1
    });

    // Optimistic update
    const originalPosts = posts;
    setPosts(prev => prev.map(p => p.id === postId ? updatePostState(p) : p));
    if(selectedPost?.id === postId) {
        setSelectedPost(p => p ? updatePostState(p) : null);
    }

    try {
        await deleteCommentService(commentId);
    } catch (error) {
        console.error("Failed to delete comment:", error);
        setPosts(originalPosts); // Revert
        if(selectedPost?.id === postId) {
            const originalPost = originalPosts.find(p => p.id === postId);
            setSelectedPost(originalPost || null);
        }
    }
  }, [posts, selectedPost]);

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

  const handleSelectPostFromAnywhere = (post: Post) => {
    setProfileOpen(false);
    setReelsOpen(false);
    setMapCenter(post.coordinates);
    setMapZoom(15);
    setSelectedPost(post);
  }

  const handleDeleteAccount = useCallback(async () => {
    if (!userProfile) return;
    try {
      await deleteCurrentUserAccount(userProfile.id);
      // onAuthStateChange will handle setting session to null
    } catch (error) {
      console.error("Failed to delete account:", error);
      alert((error as Error).message);
    }
  }, [userProfile]);
  
  if (isLoading && !session) {
    return (
        <div className="w-full h-full bg-gray-900 text-white flex flex-col items-center justify-center">
            <Spinner size="lg" />
            <p className="mt-4 text-lg">Carregando rolês...</p>
        </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  if (showUserSetup && userProfile) {
    // Show an empty string if the username is the default one derived from email
    const initialUsername = userProfile.username.includes('@') ? '' : userProfile.username;
    return <UserSetupModal onSetUsername={handleSetUsername} initialUsername={initialUsername} />;
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
        <h1 className="text-xl sm:text-2xl font-bold tracking-wider text-left shrink-0 hidden sm:block">Mapa de Rolês</h1>
        <div className="flex-grow flex justify-center px-1 sm:px-2">
            <LocationSearch onSearch={handleLocationSearch} />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => setReelsOpen(true)} className="p-2 text-gray-300 hover:text-white transition-colors" aria-label="Ver Reels">
            <ReelsIcon className="w-6 h-6"/>
          </button>
            {userProfile && (
              <button onClick={() => setProfileOpen(true)} className="flex items-center gap-2 shrink-0 p-1 rounded-full hover:bg-gray-700 transition-colors">
                  <img src={userProfile.avatar_url} alt="User Avatar" className="w-8 h-8 rounded-full"/>
                  <span className="hidden md:inline text-gray-300 text-sm font-semibold pr-2">{userProfile.username.split(' ')[0]}</span>
              </button>
            )}
        </div>
      </header>
      
      <main className="flex-grow relative z-0">
        <MapView
          posts={filteredPosts}
          onMarkerClick={handleSelectPostFromAnywhere}
          center={mapCenter}
          zoom={mapZoom}
          userLocation={location}
          mapStyle={mapStyles[currentMapStyleKey]}
        />
        
        <FilterControl activeCategories={activeCategories} setActiveCategories={setActiveCategories} />

        <div className="absolute top-4 right-4 z-[1000]">
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
          onClick={() => setCreateModalOpen(true)}
          className="absolute bottom-8 right-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 z-[1000]"
          aria-label="Criar novo post"
        >
          <PlusIcon />
        </button>
      </main>

      {selectedPost && (
        <EventDetailsModal 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)}
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
          onPostCreated={handlePostCreated}
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
          onDeletePost={handleDeletePost}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
    </div>
  );
};

export default App;