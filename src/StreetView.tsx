import { useEffect, useRef } from 'react';
// 1. Import the new functional methods instead of 'Loader'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

export default function StreetView() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initStreetView = async () => {
      try {
        // 2. Set your API key and options globally
        setOptions({
          key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
          v: 'weekly',
        });

        // 3. Import the library directly
        const { StreetViewPanorama } = await importLibrary('streetView') as any;

        if (mapRef.current) {
          const startingLocation = { lat: 32.0620, lng: 34.7735 };
          
          new StreetViewPanorama(mapRef.current, {
            position: startingLocation,
            pov: { heading: 165, pitch: 0 },
            zoom: 1,
            
            // מאפשר לחיצה על הכביש כדי להתקדם
            clickToGo: true, 
            // מציג את החיצים הלבנים על הכביש לניווט
            linksControl: true, 
            // מאפשר שימוש בגלגלת העכבר לתנועה וזום
            scrollwheel: true,
            
            // הגדרות אסתטיקה ל-LOOTHUNT
            addressControl: false,
            showRoadLabels: false,
            fullscreenControl: false,
            motionTracking: true, // מאפשר תנועה חלקה יותר במכשירים תומכים
          });
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    initStreetView();
  }, []);

  return (
    <div 
      ref={mapRef} 
      style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }} 
    />
  );
}