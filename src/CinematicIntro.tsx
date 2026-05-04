import { useState, useEffect } from 'react';

const SCENES = [
  { img: '/intro/1.png', text: "I don't know how much longer we can hold them off...", duration: 5000, effect: 'zoom-in' },
  { img: '/intro/2.png', text: "The bank... they said we have thirty days. They're taking everything.", duration: 6000, effect: 'pan-right' },
  { img: '/intro/3.png', text: "Wait... what was that in the wind?", duration: 4000, effect: 'zoom-in-fast' },
  { img: '/intro/4.png', text: "An envelope? Out here in the yard?", duration: 4000, effect: 'pan-left' },
  { img: '/intro/5.png', text: "No sender... just a single page.", duration: 5000, effect: 'zoom-out' },
  { img: '/intro/6.png', text: "what are those weird symbols?", duration: 6000, effect: 'zoom-in-slow' }
];

export default function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  // Function to move to the next step
  const nextStep = () => {
    if (step < SCENES.length - 1) {
      setStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  useEffect(() => {
    // Auto-advance timer
    const timer = setTimeout(() => {
      nextStep();
    }, SCENES[step].duration);

    // Cleanup timer if user clicks manually
    return () => clearTimeout(timer);
  }, [step]);

  return (
    <div 
      className="fixed inset-0 z-[999] bg-black overflow-hidden flex items-center justify-center font-['Outfit'] cursor-pointer"
      onClick={nextStep} // Click anywhere to advance
    >
      
      {/* Image Layer */}
      <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out bg-black pointer-events-none">
        <img 
          key={SCENES[step].img}
          src={SCENES[step].img} 
          className={`w-full h-full object-cover transition-transform duration-[7000ms] ease-linear
            ${SCENES[step].effect === 'zoom-in' ? 'animate-ken-zoom-in' : ''}
            ${SCENES[step].effect === 'pan-right' ? 'animate-ken-pan-right' : ''}
            ${SCENES[step].effect === 'zoom-in-fast' ? 'animate-ken-zoom-in-fast' : ''}
            ${SCENES[step].effect === 'pan-left' ? 'animate-ken-pan-left' : ''}
            ${SCENES[step].effect === 'zoom-out' ? 'animate-ken-zoom-out' : ''}
            ${SCENES[step].effect === 'zoom-in-slow' ? 'animate-ken-zoom-in-slow' : ''}
          `}
        />
      </div>

      {/* Cinematic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 opacity-95 pointer-events-none" />
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] pointer-events-none" />

      {/* Text Overlay */}
      <div className="absolute bottom-24 w-full text-center px-10 z-10 pointer-events-none">
        <p className="text-2xl md:text-4xl font-medium text-white drop-shadow-[0_2px_15px_rgba(0,0,0,1)] italic tracking-tight transition-all duration-700 animate-pulse-slow">
           {`"${SCENES[step].text}"`}
        </p>
      </div>

      {/* Skip Button */}
      <div className="absolute top-10 right-10 flex gap-4 z-20">
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Prevents 'nextStep' from firing when clicking skip
            onComplete();
          }}
          className="text-white/40 hover:text-white font-bold tracking-widest text-xs transition-colors border border-white/20 hover:border-white px-5 py-2.5 rounded-full uppercase bg-black/40 backdrop-blur-sm"
        >
          Skip Intro
        </button>
      </div>

      {/* Subtle "Click to continue" hint on the first screen only */}
      {step === 0 && (
        <div className="absolute bottom-8 w-full text-center text-white/20 text-xs uppercase tracking-[0.2em] animate-pulse pointer-events-none">
          Click anywhere to advance
        </div>
      )}
    </div>
  );
}