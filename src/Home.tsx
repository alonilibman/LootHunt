import React, { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

export default function LoothuntHome() {
  // Tell TypeScript this ref belongs to a div
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        // Force TypeScript to accept this as a string
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string, 
        version: "weekly",
      });

      // Swapped back to .load() to satisfy your current TypeScript definitions
      await (loader as any).load();

      if (mapRef.current) {
        // Cast window to 'any' to bypass strict google.maps typing
        new (window as any).google.maps.Map(mapRef.current, {
          center: { lat: 0, lng: 0 }, 
          zoom: 2,
          disableDefaultUI: true, 
          mapTypeId: 'satellite'
        });
      }
    };

    initMap();
  }, []);

  const handleNewGame = () => {
    const confirmStart = window.confirm("Start a new game? This will reset your current progress.");
    if (confirmStart) {
      console.log("Starting new game steps...");
    }
  };

  const handleAuth = () => {
    console.log("Triggering Firebase Google/Anonymous Auth...");
  };

  return (
    <div className="relative w-full h-screen font-['Outfit'] overflow-hidden bg-gray-900">
      
      <div ref={mapRef} className="absolute inset-0 z-0 opacity-50" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-white">
        
        <h1 className="text-6xl font-bold mb-12 tracking-wider drop-shadow-lg">
          LOOTHUNT
        </h1>

        <div className="flex flex-col gap-4 w-64">
          <button 
            onClick={handleAuth}
            className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors duration-200 shadow-md"
          >
            Login / Register
          </button>

          <button 
            onClick={handleNewGame}
            className="w-full py-3 px-6 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition-colors duration-200 shadow-md"
          >
            New Game
          </button>

          <button 
            className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors duration-200 shadow-md"
          >
            Continue
          </button>

          <button 
            disabled
            className="w-full py-3 px-6 bg-gray-800 text-gray-400 rounded-lg font-semibold cursor-not-allowed border border-gray-700"
          >
            Shop (Empty)
          </button>
        </div>
      </div>
    </div>
  );
}