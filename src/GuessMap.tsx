import { useEffect, useRef, useState } from 'react';
import { importLibrary } from '@googlemaps/js-api-loader';

interface GuessMapProps {
  onGuessSelected: (latLng: { lat: number, lng: number }) => void;
  actualLocation: { lat: number, lng: number } | null;
  allGuesses?: any[];
  roundKey: number;
  isLockedIn?: boolean;
}

export default function GuessMap({ onGuessSelected, actualLocation, allGuesses, roundKey, isLockedIn }: GuessMapProps) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const localGuessMarkerRef = useRef<any>(null);
  const playerMarkersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const actualMarkerRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  
  const [mapSize, setMapSize] = useState<'S' | 'M' | 'L'>('S');
  const isPlayingRef = useRef(true);
  const resultShownRef = useRef(false);

  const isLockedInRef = useRef(isLockedIn);
  useEffect(() => { isLockedInRef.current = isLockedIn; }, [isLockedIn]);

  useEffect(() => {
    const initMap = async () => {
      const { Map } = await importLibrary('maps') as any;
      if (mapDivRef.current && !mapInstance.current) {
        mapInstance.current = new Map(mapDivRef.current, {
          center: { lat: 20, lng: 0 }, zoom: 1, disableDefaultUI: true, zoomControl: true, mapId: 'LH_TRACKER', gestureHandling: 'greedy'
        });

        mapInstance.current.addListener('click', async (e: any) => {
          if (!isPlayingRef.current || isLockedInRef.current) return; 
          const { Marker } = await importLibrary('marker') as any;
          const latLng = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          
          if (localGuessMarkerRef.current) localGuessMarkerRef.current.setPosition(latLng);
          else localGuessMarkerRef.current = new Marker({ 
            position: latLng, map: mapInstance.current,
            icon: { path: (window as any).google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: '#FFF', fillOpacity: 1, strokeWeight: 2, strokeColor: '#f59e0b' }
          });
          onGuessSelected(latLng);
        });
      }
    };
    initMap();
  }, [onGuessSelected]);

  useEffect(() => {
    const showResult = async () => {
      if (actualLocation && mapInstance.current && !resultShownRef.current) {
        resultShownRef.current = true; isPlayingRef.current = false;
        const googleNamespace = (window as any).google;
        if (localGuessMarkerRef.current) localGuessMarkerRef.current.setMap(null);
        setMapSize('M'); 

        setTimeout(() => {
          const bounds = new googleNamespace.maps.LatLngBounds();
          bounds.extend(actualLocation);
          
          // Plot User Guess
          if (playerMarkersRef.current[0]) {
            bounds.extend(playerMarkersRef.current[0].getPosition());
          }

          actualMarkerRef.current = new googleNamespace.maps.Marker({
            position: actualLocation, map: mapInstance.current,
            icon: { path: googleNamespace.maps.SymbolPath.CIRCLE, scale: 12, fillColor: '#f59e0b', fillOpacity: 1, strokeWeight: 3, strokeColor: '#FFF' },
            animation: googleNamespace.maps.Animation.BOUNCE
          });

          mapInstance.current.fitBounds(bounds, { padding: 100 });
        }, 500);
      }
    };
    showResult();
  }, [actualLocation, allGuesses]);

  const getDims = () => {
    switch (mapSize) {
      case 'L': return { width: '94vw', height: '80vh', bottom: '10vh', left: '3vw' };
      case 'M': return { width: '85vw', maxWidth: '900px', height: '45vh', bottom: '40px', left: '50%', transform: 'translateX(-50%)' };
      default: return { width: '200px', height: '200px', bottom: '40px', left: '40px' };
    }
  };

  return (
    <div style={{ ...containerStyle, ...getDims() }}>
      <button onClick={() => setMapSize(s => s === 'S' ? 'M' : s === 'M' ? 'L' : 'S')} style={btnStyle}>
        {mapSize === 'S' ? 'SCAN AREA' : 'MINIMIZE'}
      </button>
      <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'absolute', zIndex: 3000, border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '24px', overflow: 'hidden',
  boxShadow: '0 30px 60px rgba(0,0,0,0.8)', backgroundColor: '#0a0a0c', transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
};

const btnStyle: React.CSSProperties = {
  position: 'absolute', top: '15px', right: '15px', zIndex: 3100, backgroundColor: 'rgba(0,0,0,0.8)', color: '#f59e0b',
  border: '1px solid #f59e0b', padding: '6px 12px', fontSize: '10px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', letterSpacing: '2px'
};