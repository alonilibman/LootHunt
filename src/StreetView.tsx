import { useEffect, useRef, useState } from 'react';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

// הגדרת המפתח
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
if (API_KEY) {
  setOptions({ key: API_KEY, v: 'weekly' });
}

export default function StreetView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const panoInstance = useRef<any>(null);
  const googleServiceRef = useRef<any>(null);
  
  const [gameState, setGameState] = useState<'START' | 'PLAYING'>('START');
  const [isWarping, setIsWarping] = useState(false);
  const [diagnostics, setDiagnostics] = useState({
    googleStatus: 'N/A',
    lastAction: 'System Standby',
    locationName: 'Unknown Sector'
  });

  const updateDiag = (update: Partial<typeof diagnostics>) => {
    setDiagnostics(prev => ({ ...prev, ...update }));
  };

  useEffect(() => {
    let isMounted = true;

    const initSequence = async () => {
      try {
        const { StreetViewPanorama, StreetViewService } = await importLibrary('streetView') as any;
        if (!isMounted) return;

        googleServiceRef.current = new StreetViewService();

        if (mapRef.current && !panoInstance.current) {
          panoInstance.current = new StreetViewPanorama(mapRef.current, {
            position: { lat: 48.8738, lng: 2.2950 },
            zoom: 1,
            visible: true,
            source: 'outdoor' as any,
            addressControl: false,
            showRoadLabels: false,
            clickToGo: true,
          });

          panoInstance.current.addListener('status_changed', () => {
            updateDiag({ googleStatus: panoInstance.current.getStatus() });
          });
        }
      } catch (err: any) {
        updateDiag({ lastAction: `ERROR: ${err.message}` });
      }
    };

    setTimeout(initSequence, 500);
    return () => { isMounted = false; };
  }, []);

  // הפונקציה המשופרת לשיגור מיידי
  const handleChaosWarp = async () => {
    if (!googleServiceRef.current || !panoInstance.current) return;

    // 1. החשכה מיידית של המסך
    setIsWarping(true);
    updateDiag({ lastAction: 'Initiating Warp Drive...' });

    let found = false;
    let attempts = 0;

    while (!found && attempts < 30) {
      attempts++;
      
      // הגרלת נ"צ על פני הגלובוס
      const lat = (Math.random() * 140) - 70;
      const lng = (Math.random() * 360) - 180;

      try {
        const response = await googleServiceRef.current.getPanorama({
          location: { lat, lng },
          radius: 100000, // רדיוס של 100 ק"מ לחיפוש מהיר יותר
          source: 'outdoor' as any
        });

        if (response && response.data && response.data.location) {
          const newPos = response.data.location.latLng;
          const locName = response.data.location.description || 'Remote Sector';

          // 2. עדכון המיקום בזמן שהמסך עדיין שחור
          panoInstance.current.setPosition(newPos);
          panoInstance.current.setPov({ heading: Math.random() * 360, pitch: 0 });
          
          updateDiag({ locationName: locName, lastAction: 'Target Locked.' });
          found = true;

          // 3. המתנה קטנה שהטקסטורות ייטענו לפני החשיפה
          setTimeout(() => {
            setIsWarping(false);
          }, 600); 
        }
      } catch (e) {
        // ממשיך לניסיון הבא
      }
    }

    if (!found) {
      setIsWarping(false);
      updateDiag({ lastAction: 'Warp Failed: No Signal.' });
    }
  };

  const handleStartGame = () => {
    setGameState('PLAYING');
    setTimeout(() => {
      if (panoInstance.current && (window as any).google) {
        (window as any).google.maps.event.trigger(panoInstance.current, 'resize');
      }
    }, 400);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}>
      
      {/* שכבת המפה */}
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', height: '100%', position: 'absolute',
          visibility: gameState === 'PLAYING' ? 'visible' : 'hidden'
        }} 
      />

      {/* --- Warp Overlay: המסך השחור שחוסם את ה"קפיצה" --- */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2800,
        backgroundColor: '#000',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        transition: 'opacity 0.4s ease',
        opacity: isWarping ? 1 : 0,
        pointerEvents: isWarping ? 'all' : 'none',
        flexDirection: 'column'
      }}>
        <div style={{ color: '#00ff41', fontFamily: 'monospace', fontSize: '1.5rem', letterSpacing: '5px' }}>
          WARPING_TO_COORDINATES...
        </div>
        <div style={{ color: '#00ff41', opacity: 0.5, marginTop: '10px' }}>{diagnostics.lastAction}</div>
      </div>

      {/* כפתור Warp */}
      {gameState === 'PLAYING' && (
        <button 
          disabled={isWarping}
          onClick={handleChaosWarp}
          style={warpButtonStyle}
        >
          [ CHAOS_WARP ]
        </button>
      )}

      {/* דיבאגר */}
      <div style={debugPanelStyle}>
        <div style={{ borderBottom: '1px solid #00ff41', marginBottom: '5px' }}>LOOTHUNT_V2 // STABLE</div>
        <div>LOC: {diagnostics.locationName}</div>
        <div>STATUS: {diagnostics.googleStatus}</div>
      </div>

      {/* דף נחיתה */}
      {gameState === 'START' && (
        <div style={landingStyle}>
          <h1 style={titleStyle}>LOOTHUNT</h1>
          <button onClick={handleStartGame} style={buttonStyle}>INITIALIZE</button>
        </div>
      )}
    </div>
  );
}

// --- סטיילים ---
const debugPanelStyle: React.CSSProperties = {
  position: 'absolute', top: 20, right: 20, zIndex: 3000,
  width: '260px', backgroundColor: 'rgba(0,0,0,0.8)',
  border: '1px solid #00ff41', padding: '12px',
  fontFamily: 'monospace', fontSize: '11px', color: '#00ff41', pointerEvents: 'none'
};

const warpButtonStyle: React.CSSProperties = {
  position: 'absolute', bottom: '40px', right: '40px', zIndex: 2500,
  padding: '15px 35px', backgroundColor: 'rgba(0, 0, 0, 0.9)',
  color: '#00ff41', border: '2px solid #00ff41', fontFamily: 'monospace',
  cursor: 'pointer', fontSize: '1.1rem', letterSpacing: '3px'
};

const landingStyle: React.CSSProperties = {
  position: 'absolute', inset: 0, zIndex: 1000,
  display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
  backgroundColor: '#000', fontFamily: 'monospace'
};

const titleStyle: React.CSSProperties = {
  fontSize: '5rem', color: '#00ff41', letterSpacing: '20px', textShadow: '0 0 30px #00ff41'
};

const buttonStyle: React.CSSProperties = {
  padding: '15px 60px', backgroundColor: 'transparent', color: '#00ff41',
  border: '2px solid #00ff41', fontSize: '1.4rem', cursor: 'pointer', letterSpacing: '5px'
};