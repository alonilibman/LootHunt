import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { auth, googleProvider, signInWithPopup, signOut, db } from './firebase'; 
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore'; 
import CinematicIntro from './CinematicIntro';
import GuessMap from './GuessMap';

type GState = 'MENU' | 'INTRO' | 'ENVELOPE' | 'PLAYING' | 'RESULT';

export default function Home() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [gameState, setGameState] = useState<GState>('MENU');
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [playerGuess, setPlayerGuess] = useState<{lat: number, lng: number} | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const targetLocation = { lat: 31.5, lng: 35.5 }; 
  const SUCCESS_RADIUS_KM = 80; 

  // --- 1. AUTH LOGIC (POPUP ONLY) ---
  const handleAuth = async () => {
    console.log("Initializing Authority Check via Popup...");
    try {
      if (user) {
        await signOut(auth);
        console.log("Session terminated.");
      } else {
        // Specifically using signInWithPopup as requested
        const result = await signInWithPopup(auth, googleProvider);
        console.log("Identity established for:", result.user.displayName);
      }
    } catch (e: any) {
      console.error("Auth System Error:", e.code, e.message);
      // Helpful tip for the user if it fails
      if (e.code === 'auth/popup-blocked') {
        alert("Please enable popups for LootHunt to identify your authority.");
      }
    }
  };

  // --- 2. DATABASE PERSISTENCE ---
  const saveGameProgress = async (state: GState, guess: any, dist: number | null) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid), {
        lastState: state,
        lastGuess: guess,
        lastDistance: dist,
        updatedAt: new Date()
      }, { merge: true });
    } catch (e) { console.error("Cloud Sync Failure:", e); }
  };

  const resumeJourney = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPlayerGuess(data.lastGuess || null);
        setDistance(data.lastDistance || null);
        setGameState(data.lastState || 'PLAYING');
      } else {
        setGameState('INTRO');
      }
    } catch (e) { console.error("Dossier Retrieval Error:", e); }
    setIsLoading(false);
  };

  // --- 3. CORE UTILITIES ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  const calculateDistance = (p1: any, p2: any) => {
    const R = 6371; 
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  };

  const handleConfirmCoordinates = () => {
    if (playerGuess) {
      const dist = calculateDistance(playerGuess, targetLocation);
      setDistance(dist);
      setGameState('RESULT');
      saveGameProgress('RESULT', playerGuess, dist);
    }
  };

  useEffect(() => {
    const loadBG = async () => {
      setOptions({ key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string });
      const { Map } = await importLibrary("maps") as any;
      if (mapRef.current && (gameState === 'MENU' || gameState === 'ENVELOPE')) {
        new Map(mapRef.current, { center: { lat: 31, lng: 35 }, zoom: 4, disableDefaultUI: true, mapTypeId: 'satellite', gestureHandling: 'none' });
      }
    };
    loadBG();
  }, [gameState]);

  // --- 4. RENDERER ---
  if (gameState === 'INTRO') return <CinematicIntro onComplete={() => { setGameState('ENVELOPE'); saveGameProgress('ENVELOPE', null, null); }} />;

  return (
    <div className="relative w-full h-screen font-['Outfit'] overflow-hidden bg-[#0a0a0c]">
      <div ref={mapRef} className="absolute inset-0 z-0 brightness-[0.3] contrast-[1.2] scale-105" />
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,#0a0a0c_100%)] pointer-events-none" />

      {/* MENU UI */}
      {gameState === 'MENU' && (
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-center">
          <div className="mb-12 animate-in fade-in duration-1000">
            <h1 className="text-9xl font-extralight tracking-tighter text-white">LOOT<span className="font-bold text-amber-500">HUNT</span></h1>
            <p className="text-[10px] tracking-[0.8em] text-white/30 uppercase mt-2">Find the truth. Save the home.</p>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] w-85 shadow-2xl flex flex-col gap-4">
            <button onClick={() => setGameState('INTRO')} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-4 rounded-2xl uppercase tracking-widest text-xs transition-all shadow-xl">New Expedition</button>
            
            <button 
              disabled={!user || isLoading} 
              onClick={resumeJourney}
              className="w-full py-4 border border-white/10 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-20 hover:bg-white/5 transition-all"
            >
              {isLoading ? 'Decrypting...' : 'Resume Journey'}
            </button>

            <button onClick={handleAuth} className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-[0.2em] mt-2 transition-colors">
              {user ? `End Session (${user.displayName?.split(' ')[0]})` : 'Login with Google'}
            </button>
          </div>
        </div>
      )}

      {/* ENVELOPE UI */}
      {gameState === 'ENVELOPE' && (
        <div className="relative z-[100] flex items-center justify-center h-full bg-black/70 backdrop-blur-md p-6">
          <div className="max-w-xl w-full bg-[#f4f1ea] p-12 shadow-2xl border-b-[12px] border-amber-900/10 animate-in zoom-in-95 duration-500">
            <p className="text-[10px] uppercase tracking-[0.4em] text-amber-900/40 mb-6 font-bold border-b border-amber-900/10 pb-2">The First Clue</p>
            <div className="space-y-4 text-2xl text-zinc-800 font-medium italic font-serif leading-relaxed">
              <p>"The map of 'weird symbol' will lead to the big treasure..."</p>
              <p>"Descend as much as u can and dont be afraid of its name — u can swim there."</p>
            </div>
            <button onClick={() => { setGameState('PLAYING'); saveGameProgress('PLAYING', null, null); }} className="mt-10 w-full py-4 bg-zinc-900 text-white font-bold uppercase tracking-[0.3em] text-[10px] hover:bg-amber-600 transition-all">Track Coordinates</button>
          </div>
        </div>
      )}

      {/* GAMEPLAY HUD */}
      {(gameState === 'PLAYING' || gameState === 'RESULT') && (
        <>
          <div className="absolute top-12 left-12 z-50 p-6 bg-black/60 backdrop-blur-xl border-l-2 border-amber-500">
            {gameState === 'RESULT' ? (
              <div className="animate-in fade-in slide-in-from-top-4">
                <h2 className={`text-3xl font-bold uppercase tracking-tighter ${distance! <= SUCCESS_RADIUS_KM ? 'text-amber-500' : 'text-red-500'}`}>
                  {distance! <= SUCCESS_RADIUS_KM ? 'Cache Discovered' : 'Search Area Empty'}
                </h2>
                <p className="text-white/60 text-xs mt-1 uppercase tracking-widest font-bold">Target Proximity: {Math.round(distance!)} KM</p>
                <button onClick={() => setGameState('MENU')} className="mt-4 px-4 py-2 bg-white/10 text-[10px] text-white hover:bg-white/20 tracking-widest uppercase">Back to Menu</button>
              </div>
            ) : (
              <div>
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.4em]">Active Mission</p>
                <h2 className="text-xl text-white font-light italic">"Follow the symbols to the lowest point..."</h2>
                {playerGuess && (
                  <button onClick={handleConfirmCoordinates} className="mt-6 px-8 py-2.5 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest shadow-lg">Confirm Pin</button>
                )}
              </div>
            )}
          </div>

          {/* ACTION HUB */}
          <div className="absolute bottom-10 right-10 z-[4000] flex flex-col items-end gap-4">
            {isHubOpen && (
              <div className="grid grid-cols-2 gap-3 mb-2 animate-in fade-in slide-in-from-bottom-5 duration-300">
                {[
                  { icon: '🎒', label: 'Backpack' },
                  { icon: '🧩', label: 'Active Clues', action: () => setGameState('ENVELOPE') },
                  { icon: '📝', label: 'Notes' },
                  { icon: '⚖️', label: 'Market' },
                  { icon: '🚪', label: 'Abort', action: () => setGameState('MENU') },
                ].map(item => (
                  <button key={item.label} onClick={() => { item.action?.() || setIsHubOpen(false); }} className="w-36 p-4 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-2xl flex flex-col items-start hover:bg-amber-500 group transition-all">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-[9px] font-bold uppercase text-amber-500 group-hover:text-black tracking-widest">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setIsHubOpen(!isHubOpen)} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl border-2 ${isHubOpen ? 'bg-white border-white rotate-45' : 'bg-amber-500 border-amber-400'}`}>
              <div className="relative w-6 h-6"><div className="absolute top-1/2 left-0 w-full h-0.5 bg-black" /><div className="absolute top-0 left-1/2 h-full w-0.5 bg-black" /></div>
            </button>
          </div>

          <GuessMap onGuessSelected={setPlayerGuess} actualLocation={gameState === 'RESULT' ? targetLocation : null} roundKey={1} isLockedIn={gameState === 'RESULT'} />
        </>
      )}
    </div>
  );
}