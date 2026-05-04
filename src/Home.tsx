import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { auth, googleProvider, signInWithPopup, signOut } from './firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import CinematicIntro from './CinematicIntro';

export default function Home() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isPlayingIntro, setIsPlayingIntro] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const initMap = async () => {
      try {
        setOptions({
          key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string, 
        });
        await importLibrary("maps");
        if (mapRef.current && (window as any).google) {
          new (window as any).google.maps.Map(mapRef.current, {
            center: { lat: 0, lng: 0 }, 
            zoom: 2,
            disableDefaultUI: true, 
            mapTypeId: 'satellite'
          });
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };
    initMap();
  }, []);

  const handleAuth = async () => {
    try {
      if (user) {
        await signOut(auth);
      } else {
        // Firebase will complete the sign-in even if the COOP error triggers
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error: any) {
      // Check if it's just the annoying popup-closed error
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error("Authentication Error:", error);
      }
    }
  };

  if (isPlayingIntro) {
    return <CinematicIntro onComplete={() => setIsPlayingIntro(false)} />;
  }

  return (
    <div className="relative w-full h-screen font-['Outfit'] overflow-hidden bg-gray-900">
      <div ref={mapRef} className="absolute inset-0 z-0 opacity-50" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-white text-center">
        <h1 className="text-6xl font-bold mb-12 tracking-wider drop-shadow-lg">LootHunt</h1>
        <div className="flex flex-col gap-4 w-64">
          <button onClick={handleAuth} className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold shadow-md">
            {user ? `Logout (${user.displayName?.split(' ')[0]})` : 'Login with Google'}
          </button>
          <button onClick={() => setIsPlayingIntro(true)}>New Game</button>
          <button disabled={!user} className={`w-full py-3 px-6 rounded-lg font-semibold shadow-md ${user ? 'bg-gray-700' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}>
            Continue
          </button>
          <button disabled className="w-full py-3 px-6 bg-gray-800 text-gray-400 rounded-lg cursor-not-allowed border border-gray-700">
            Shop (Empty)
          </button>
        </div>
      </div>
    </div>
  );
  
}