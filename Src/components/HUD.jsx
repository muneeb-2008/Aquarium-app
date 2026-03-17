/**
 * HUD.jsx - Heads-Up Display & Floating Guide System
 * Version 0.5 (Safety & Guidance Update)
 * 
 * Renders overlay UI elements including:
 * - Mode indicator
 * - Safety warnings
 * - Tank stats (weight, dimensions)
 * - Care meters (hunger, algae)
 * - Floating Action Button (FAB) for contextual guide
 * - Guide overlay with tutorials for each FSM mode
 */

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import useZenStore, { 
  FSM_MODES, 
  TANK_PRESETS, 
  CLEARANCE_ZONE_HEIGHT 
} from '../store/useZenStore';

// ============================================================================
// ICON COMPONENTS (Simple SVG icons to avoid dependencies)
// ============================================================================

const InfoIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="w-6 h-6"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const CloseIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const WarningIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const FishIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

const DropletIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

const ScaleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

// ============================================================================
// MODE INDICATOR COMPONENT
// ============================================================================

/**
 * ModeIndicator - Shows current FSM mode with icon
 */
const ModeIndicator = ({ mode }) => {
  const modeConfig = useMemo(() => ({
    [FSM_MODES.IDLE]: { label: 'Ready', color: 'bg-gray-500' },
    [FSM_MODES.SCANNING]: { label: 'Scanning', color: 'bg-blue-500', pulse: true },
    [FSM_MODES.PLACING]: { label: 'Placing', color: 'bg-green-500' },
    [FSM_MODES.DESIGNING]: { label: 'Designing', color: 'bg-purple-500' },
    [FSM_MODES.CARE]: { label: 'Care Mode', color: 'bg-teal-500' },
    [FSM_MODES.MENU]: { label: 'Menu', color: 'bg-gray-600' },
    [FSM_MODES.GUIDE]: { label: 'Guide', color: 'bg-amber-500' },
  }), []);
  
  const config = modeConfig[mode] || modeConfig[FSM_MODES.IDLE];
  
  return (
    <div className="flex items-center gap-2">
      <div className={`
        w-2.5 h-2.5 rounded-full ${config.color}
        ${config.pulse ? 'animate-pulse' : ''}
      `} />
      <span className="text-sm font-medium text-white/90">
        {config.label}
      </span>
    </div>
  );
};

// ============================================================================
// SAFETY WARNING BANNER
// ============================================================================

/**
 * SafetyWarning - Displays active safety warnings with haptic trigger
 */
const SafetyWarning = ({ warning, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (warning.active) {
      setIsVisible(true);
      // Haptic feedback on warning
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } else {
      setIsVisible(false);
    }
  }, [warning.active]);
  
  if (!isVisible) return null;
  
  const warningColors = {
    SURFACE_TOO_SMALL: 'from-red-500/90 to-red-600/90',
    CLEARANCE_BLOCKED: 'from-orange-500/90 to-orange-600/90',
    WEIGHT_EXCEEDED: 'from-yellow-500/90 to-yellow-600/90',
  };
  
  return (
    <div className={`
      absolute top-20 left-4 right-4
      bg-gradient-to-r ${warningColors[warning.type] || 'from-red-500/90 to-red-600/90'}
      backdrop-blur-md rounded-xl
      px-4 py-3
      flex items-center gap-3
      shadow-lg shadow-red-500/20
      animate-slideDown
    `}>
      <div className="flex-shrink-0 text-white">
        <WarningIcon />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-white">
          {warning.message}
        </p>
      </div>
      <button 
        onClick={onDismiss}
        className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
      >
        <CloseIcon />
      </button>
    </div>
  );
};

// ============================================================================
// TANK STATS PANEL
// ============================================================================

/**
 * TankStats - Shows current tank specifications
 */
const TankStats = ({ tank }) => {
  const weight = tank.volumeLiters + (tank.id === 'NANO' ? 5 : tank.id === 'STANDARD' ? 12 : 25);
  const dims = tank.dimensions;
  
  return (
    <div className="
      bg-black/40 backdrop-blur-md
      rounded-xl px-4 py-3
      border border-white/10
    ">
      <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">
        {tank.name}
      </h3>
      
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70 flex items-center gap-1.5">
            <ScaleIcon />
            Size
          </span>
          <span className="text-white font-medium">
            {(dims.width * 100).toFixed(0)} × {(dims.depth * 100).toFixed(0)} × {(dims.height * 100).toFixed(0)} cm
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70 flex items-center gap-1.5">
            <DropletIcon />
            Volume
          </span>
          <span className="text-white font-medium">
            {tank.volumeLiters} L
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70 flex items-center gap-1.5">
            ⚖️
            Weight
          </span>
          <span className="text-white font-bold text-amber-400">
            {weight} kg
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CARE METERS
// ============================================================================

/**
 * CareMeter - Circular progress indicator for hunger/algae
 */
const CareMeter = ({ value, max, label, color, icon }) => {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 18; // radius = 18
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-12 h-12">
        {/* Background circle */}
        <svg className="w-12 h-12 -rotate-90">
          <circle
            cx="24"
            cy="24"
            r="18"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-white/10"
          />
          <circle
            cx="24"
            cy="24"
            r="18"
            stroke={color}
            strokeWidth="4"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center text-white/80">
          {icon}
        </div>
      </div>
      
      <span className="text-[10px] text-white/60 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
};

/**
 * CarePanel - Contains hunger and algae meters
 */
const CarePanel = ({ hungerLevel, algaeLevel, happiness }) => (
  <div className="
    bg-black/40 backdrop-blur-md
    rounded-xl px-4 py-3
    border border-white/10
  ">
    <div className="flex items-center justify-between gap-4">
      <CareMeter
        value={hungerLevel}
        max={100}
        label="Hunger"
        color={hungerLevel > 70 ? '#ef4444' : hungerLevel > 40 ? '#f59e0b' : '#22c55e'}
        icon="🍽️"
      />
      
      <CareMeter
        value={algaeLevel}
        max={100}
        label="Algae"
        color={algaeLevel > 70 ? '#ef4444' : algaeLevel > 40 ? '#f59e0b' : '#22c55e'}
        icon="🌿"
      />
      
      <CareMeter
        value={happiness}
        max={100}
        label="Happy"
        color={happiness > 70 ? '#22c55e' : happiness > 40 ? '#f59e0b' : '#ef4444'}
        icon="😊"
      />
    </div>
  </div>
);

// ============================================================================
// GUIDE OVERLAY COMPONENT
// ============================================================================

/**
 * GuideOverlay - Full-screen contextual tutorial
 */
const GuideOverlay = ({ content, onClose }) => {
  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  return (
    <div className="
      fixed inset-0 z-50
      bg-black/60 backdrop-blur-sm
      flex items-center justify-center
      p-4
      animate-fadeIn
    ">
      {/* Guide Card */}
      <div className="
        w-full max-w-md
        bg-gradient-to-br from-slate-800/95 to-slate-900/95
        backdrop-blur-xl
        rounded-2xl
        border border-white/10
        shadow-2xl shadow-black/50
        overflow-hidden
        animate-scaleIn
      ">
        {/* Header */}
        <div className="
          bg-gradient-to-r from-teal-500 to-cyan-500
          px-6 py-4
          flex items-center justify-between
        ">
          <h2 className="text-xl font-bold text-white">
            {content.title}
          </h2>
          <button
            onClick={onClose}
            className="
              p-2 rounded-full
              bg-white/20 hover:bg-white/30
              transition-colors
              text-white
            "
          >
            <CloseIcon />
          </button>
        </div>
        
        {/* Steps */}
        <div className="px-6 py-5 space-y-4">
          <ol className="space-y-3">
            {content.steps.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="
                  flex-shrink-0
                  w-6 h-6 rounded-full
                  bg-teal-500/20 text-teal-400
                  flex items-center justify-center
                  text-sm font-bold
                ">
                  {index + 1}
                </span>
                <span className="text-white/80 text-sm leading-relaxed pt-0.5">
                  {step}
                </span>
              </li>
            ))}
          </ol>
          
          {/* Tips Section */}
          {content.tips && (
            <div className="
              mt-4 pt-4
              border-t border-white/10
            ">
              <div className="
                bg-amber-500/10 border border-amber-500/20
                rounded-xl px-4 py-3
              ">
                <p className="text-sm text-amber-200/90">
                  <span className="font-semibold">💡 Pro Tip: </span>
                  {content.tips}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="
              w-full py-3 px-4
              bg-gradient-to-r from-teal-500 to-cyan-500
              hover:from-teal-400 hover:to-cyan-400
              text-white font-semibold
              rounded-xl
              transition-all
              shadow-lg shadow-teal-500/25
              active:scale-[0.98]
            "
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// FLOATING ACTION BUTTON (FAB)
// ============================================================================

/**
 * FloatingActionButton - Glassmorphism FAB for triggering guide
 */
const FloatingActionButton = ({ onClick, isGuideOpen }) => {
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        fixed bottom-6 right-6 z-40
        w-14 h-14
        rounded-full
        
        /* Glassmorphism effect */
        bg-white/10
        backdrop-blur-xl
        border border-white/20
        
        /* Shadow and glow */
        shadow-lg shadow-black/20
        
        /* Flex center */
        flex items-center justify-center
        
        /* Transitions */
        transition-all duration-200
        
        /* Hover state */
        hover:bg-white/20
        hover:border-white/30
        hover:shadow-xl
        hover:scale-105
        
        /* Active state */
        ${isPressed ? 'scale-95 bg-white/25' : ''}
        ${isGuideOpen ? 'rotate-45' : ''}
        
        /* Focus ring */
        focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2 focus:ring-offset-transparent
      `}
      aria-label={isGuideOpen ? 'Close guide' : 'Open guide'}
    >
      <span className="text-white/90">
        {isGuideOpen ? <CloseIcon /> : <InfoIcon />}
      </span>
      
      {/* Ripple effect ring */}
      <span className="
        absolute inset-0
        rounded-full
        border-2 border-teal-400/30
        animate-ping
        pointer-events-none
      " style={{ animationDuration: '2s' }} />
    </button>
  );
};

// ============================================================================
// MAIN HUD COMPONENT
// ============================================================================

/**
 * HUD - Main heads-up display component
 */
const HUD = () => {
  // Store state
  const {
    mode,
    selectedTank,
    safetyWarning,
    hungerLevel,
    algaeLevel,
    getHappiness,
    getGuideContent,
    setMode,
    returnToPreviousMode,
    clearSafetyWarning,
  } = useZenStore();
  
  // Derived state
  const happiness = getHappiness();
  const guideContent = getGuideContent();
  const isGuideOpen = mode === FSM_MODES.GUIDE;
  const showCareMeters = mode === FSM_MODES.CARE;
  const showTankStats = [FSM_MODES.SCANNING, FSM_MODES.PLACING, FSM_MODES.DESIGNING].includes(mode);
  
  // ========================================================================
  // HANDLERS
  // ========================================================================
  
  const handleFABClick = useCallback(() => {
    if (isGuideOpen) {
      returnToPreviousMode();
    } else {
      setMode(FSM_MODES.GUIDE);
    }
  }, [isGuideOpen, setMode, returnToPreviousMode]);
  
  const handleGuideClose = useCallback(() => {
    returnToPreviousMode();
  }, [returnToPreviousMode]);
  
  const handleWarningDismiss = useCallback(() => {
    clearSafetyWarning();
  }, [clearSafetyWarning]);
  
  // ========================================================================
  // RENDER
  // ========================================================================
  
  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      {/* Top Bar - Mode Indicator */}
      <div className="
        absolute top-4 left-4
        pointer-events-auto
      ">
        <div className="
          bg-black/40 backdrop-blur-md
          rounded-full px-4 py-2
          border border-white/10
        ">
          <ModeIndicator mode={mode} />
        </div>
      </div>
      
      {/* Safety Warning Banner */}
      <div className="pointer-events-auto">
        <SafetyWarning 
          warning={safetyWarning} 
          onDismiss={handleWarningDismiss}
        />
      </div>
      
      {/* Left Panel - Tank Stats (during scanning/placing/designing) */}
      {showTankStats && (
        <div className="
          absolute top-20 left-4
          pointer-events-auto
          animate-slideRight
        ">
          <TankStats tank={selectedTank} />
        </div>
      )}
      
      {/* Bottom Left - Care Meters (during care mode) */}
      {showCareMeters && (
        <div className="
          absolute bottom-24 left-4
          pointer-events-auto
          animate-slideUp
        ">
          <CarePanel 
            hungerLevel={hungerLevel}
            algaeLevel={algaeLevel}
            happiness={happiness}
          />
        </div>
      )}
      
      {/* Clearance Info (during placing) */}
      {mode === FSM_MODES.PLACING && (
        <div className="
          absolute bottom-24 left-1/2 -translate-x-1/2
          pointer-events-none
        ">
          <div className="
            bg-black/60 backdrop-blur-md
            rounded-full px-4 py-2
            border border-amber-500/30
          ">
            <p className="text-xs text-amber-300">
              🔶 Orange box = {CLEARANCE_ZONE_HEIGHT * 100}cm maintenance clearance
            </p>
          </div>
        </div>
      )}
      
      {/* Floating Action Button */}
      <div className="pointer-events-auto">
        <FloatingActionButton 
          onClick={handleFABClick}
          isGuideOpen={isGuideOpen}
        />
      </div>
      
      {/* Guide Overlay */}
      {isGuideOpen && (
        <div className="pointer-events-auto">
          <GuideOverlay 
            content={guideContent}
            onClose={handleGuideClose}
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// TAILWIND ANIMATION STYLES (add to your global CSS or tailwind config)
// ============================================================================

/*
Add these to your tailwind.config.js:

module.exports = {
  theme: {
    extend: {
      animation: {
        'fadeIn': 'fadeIn 0.2s ease-out',
        'scaleIn': 'scaleIn 0.3s ease-out',
        'slideDown': 'slideDown 0.3s ease-out',
        'slideUp': 'slideUp 0.3s ease-out',
        'slideRight': 'slideRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
}
*/

// ============================================================================
// EXPORTS
// ============================================================================

export default HUD;
export { 
  ModeIndicator, 
  SafetyWarning, 
  TankStats, 
  CarePanel, 
  GuideOverlay, 
  FloatingActionButton 
};
