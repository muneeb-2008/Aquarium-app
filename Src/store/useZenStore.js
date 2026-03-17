/**
 * useZenStore.js - Zen Aquarium State Management
 * Version 0.5 (Safety & Guidance Update)
 * 
 * Zustand store managing the 7-mode Finite State Machine,
 * game tick mechanics, tank configuration, and safety warnings.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Finite State Machine Modes
 * IDLE -> SCANNING -> PLACING -> DESIGNING -> CARE -> MENU/GUIDE
 */
export const FSM_MODES = {
  IDLE: 'IDLE',           // Initial state, waiting for XR session
  SCANNING: 'SCANNING',   // AR hit-testing, surface detection
  PLACING: 'PLACING',     // Tank placement with constraints validation
  DESIGNING: 'DESIGNING', // Aquascaping: plants, decor, fish selection
  CARE: 'CARE',           // Active game loop: feeding, cleaning, observing
  MENU: 'MENU',           // Pause menu overlay
  GUIDE: 'GUIDE',         // Contextual tutorial overlay
};

/**
 * Tank Presets with Physical Specifications
 * All measurements in meters (1:1 metric scale)
 * Water weight: 1L = 1kg
 */
export const TANK_PRESETS = {
  NANO: {
    id: 'NANO',
    name: 'Nano Cube',
    dimensions: { width: 0.30, height: 0.30, depth: 0.30 }, // 30cm cube
    volumeLiters: 27, // 30 * 30 * 30 = 27,000 cm³ = 27L
    get filledWeightKg() { return this.volumeLiters + 5; }, // Water + glass/substrate
    footprint: { width: 0.30, depth: 0.30 },
    recommendedFish: 5,
    description: 'Perfect for desktops and small spaces',
  },
  STANDARD: {
    id: 'STANDARD',
    name: 'Standard Tank',
    dimensions: { width: 0.60, height: 0.40, depth: 0.30 }, // 60x40x30cm
    volumeLiters: 72, // 60 * 40 * 30 = 72,000 cm³ = 72L
    get filledWeightKg() { return this.volumeLiters + 12; }, // Water + glass/substrate
    footprint: { width: 0.60, depth: 0.30 },
    recommendedFish: 15,
    description: 'Classic aquarium for most spaces',
  },
  GRAND: {
    id: 'GRAND',
    name: 'Grand Display',
    dimensions: { width: 1.00, height: 0.50, depth: 0.40 }, // 100x50x40cm
    volumeLiters: 200, // 100 * 50 * 40 = 200,000 cm³ = 200L
    get filledWeightKg() { return this.volumeLiters + 25; }, // Water + glass/substrate
    footprint: { width: 1.00, depth: 0.40 },
    recommendedFish: 30,
    description: 'Stunning centerpiece aquarium',
  },
};

/**
 * Clearance Zone Height (meters)
 * Required space above tank for maintenance access
 */
export const CLEARANCE_ZONE_HEIGHT = 0.30; // 30cm

/**
 * Game Tick Configuration
 */
const GAME_TICK_INTERVAL = 5000; // 5 seconds
const HUNGER_DECAY_RATE = 0.5; // Per tick
const ALGAE_GROWTH_RATE = 0.3; // Per tick
const MAX_HUNGER = 100;
const MAX_ALGAE = 100;

// ============================================================================
// STORE DEFINITION
// ============================================================================

const useZenStore = create(
  subscribeWithSelector((set, get) => ({
    // ========================================================================
    // FSM STATE
    // ========================================================================
    
    /** Current mode of the application */
    mode: FSM_MODES.IDLE,
    
    /** Previous mode (for returning from GUIDE/MENU) */
    previousMode: null,
    
    /** Transition to a new FSM mode */
    setMode: (newMode) => {
      const currentMode = get().mode;
      
      // Store previous mode when entering GUIDE or MENU
      if (newMode === FSM_MODES.GUIDE || newMode === FSM_MODES.MENU) {
        set({ previousMode: currentMode, mode: newMode });
      } else {
        set({ mode: newMode, previousMode: null });
      }
    },
    
    /** Return from GUIDE/MENU to previous mode */
    returnToPreviousMode: () => {
      const { previousMode } = get();
      if (previousMode) {
        set({ mode: previousMode, previousMode: null });
      }
    },
    
    /** Check if game tick should be paused */
    isGamePaused: () => {
      const { mode } = get();
      return mode === FSM_MODES.GUIDE || mode === FSM_MODES.MENU || mode === FSM_MODES.IDLE;
    },

    // ========================================================================
    // TANK CONFIGURATION
    // ========================================================================
    
    /** Selected tank preset */
    selectedTank: TANK_PRESETS.STANDARD,
    
    /** Tank position in world space (set after placement) */
    tankPosition: null,
    
    /** Tank rotation (Y-axis only) */
    tankRotation: 0,
    
    /** Select a tank preset by ID */
    selectTank: (tankId) => {
      const preset = TANK_PRESETS[tankId];
      if (preset) {
        set({ selectedTank: preset });
      }
    },
    
    /** Set tank world position after successful placement */
    setTankPosition: (position) => set({ tankPosition: position }),
    
    /** Set tank Y rotation */
    setTankRotation: (rotation) => set({ tankRotation: rotation }),
    
    /** Get filled weight of current tank */
    getFilledWeight: () => {
      const { selectedTank } = get();
      return selectedTank.filledWeightKg;
    },

    // ========================================================================
    // SAFETY & CONSTRAINTS
    // ========================================================================
    
    /** Safety warning state */
    safetyWarning: {
      active: false,
      type: null, // 'SURFACE_TOO_SMALL' | 'CLEARANCE_BLOCKED' | 'WEIGHT_EXCEEDED'
      message: '',
    },
    
    /** Detected surface dimensions from hit-testing */
    detectedSurface: {
      area: null,
      width: null,
      depth: null,
      isValid: false,
    },
    
    /** Set safety warning */
    setSafetyWarning: (type, message) => {
      set({
        safetyWarning: {
          active: true,
          type,
          message,
        },
      });
      
      // Trigger haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]); // Warning pattern
      }
    },
    
    /** Clear safety warning */
    clearSafetyWarning: () => {
      set({
        safetyWarning: {
          active: false,
          type: null,
          message: '',
        },
      });
    },
    
    /** Update detected surface info */
    setDetectedSurface: (surfaceData) => {
      const { selectedTank } = get();
      const { width, depth, area } = surfaceData;
      
      // Check if surface is large enough for tank footprint
      const tankFootprint = selectedTank.footprint;
      const isValid = width >= tankFootprint.width && depth >= tankFootprint.depth;
      
      set({
        detectedSurface: {
          ...surfaceData,
          isValid,
        },
      });
      
      // Trigger warning if surface too small
      if (!isValid) {
        get().setSafetyWarning(
          'SURFACE_TOO_SMALL',
          `Surface too small for ${selectedTank.name}. Need ${(tankFootprint.width * 100).toFixed(0)}×${(tankFootprint.depth * 100).toFixed(0)}cm`
        );
      } else {
        get().clearSafetyWarning();
      }
      
      return isValid;
    },
    
    /** Check clearance zone above placement point */
    checkClearanceZone: (hasObstruction) => {
      if (hasObstruction) {
        get().setSafetyWarning(
          'CLEARANCE_BLOCKED',
          `Need ${CLEARANCE_ZONE_HEIGHT * 100}cm clearance above tank for maintenance`
        );
        return false;
      }
      return true;
    },
    
    /** Validate placement position */
    validatePlacement: (surfaceWidth, surfaceDepth, hasClearance) => {
      const { selectedTank } = get();
      const footprint = selectedTank.footprint;
      
      const surfaceOk = surfaceWidth >= footprint.width && surfaceDepth >= footprint.depth;
      
      if (!surfaceOk) {
        get().setSafetyWarning(
          'SURFACE_TOO_SMALL',
          `Surface too small. ${selectedTank.name} requires ${(footprint.width * 100).toFixed(0)}×${(footprint.depth * 100).toFixed(0)}cm`
        );
        return false;
      }
      
      if (!hasClearance) {
        get().setSafetyWarning(
          'CLEARANCE_BLOCKED',
          `Insufficient overhead clearance. Need ${CLEARANCE_ZONE_HEIGHT * 100}cm above tank.`
        );
        return false;
      }
      
      get().clearSafetyWarning();
      return true;
    },

    // ========================================================================
    // ZEN CARE GAME LOOP
    // ========================================================================
    
    /** Fish hunger level (0-100, higher = more hungry) */
    hungerLevel: 0,
    
    /** Algae buildup level (0-100) */
    algaeLevel: 0,
    
    /** Fish happiness derived from hunger + algae */
    getHappiness: () => {
      const { hungerLevel, algaeLevel } = get();
      return Math.max(0, 100 - (hungerLevel * 0.5) - (algaeLevel * 0.5));
    },
    
    /** Feed the fish (reduce hunger) */
    feedFish: () => {
      set((state) => ({
        hungerLevel: Math.max(0, state.hungerLevel - 30),
      }));
    },
    
    /** Clean the tank (reduce algae) */
    cleanTank: () => {
      set((state) => ({
        algaeLevel: Math.max(0, state.algaeLevel - 40),
      }));
    },
    
    /** Game tick - called by interval timer */
    gameTick: () => {
      const state = get();
      
      // Don't tick if game is paused
      if (state.isGamePaused()) {
        return;
      }
      
      // Only tick during CARE mode
      if (state.mode !== FSM_MODES.CARE) {
        return;
      }
      
      set((state) => ({
        hungerLevel: Math.min(MAX_HUNGER, state.hungerLevel + HUNGER_DECAY_RATE),
        algaeLevel: Math.min(MAX_ALGAE, state.algaeLevel + ALGAE_GROWTH_RATE),
      }));
    },
    
    /** Game tick interval ID */
    tickIntervalId: null,
    
    /** Start the game tick timer */
    startGameTick: () => {
      const { tickIntervalId } = get();
      
      // Clear existing interval if any
      if (tickIntervalId) {
        clearInterval(tickIntervalId);
      }
      
      const id = setInterval(() => {
        get().gameTick();
      }, GAME_TICK_INTERVAL);
      
      set({ tickIntervalId: id });
    },
    
    /** Stop the game tick timer */
    stopGameTick: () => {
      const { tickIntervalId } = get();
      if (tickIntervalId) {
        clearInterval(tickIntervalId);
        set({ tickIntervalId: null });
      }
    },

    // ========================================================================
    // AQUARIUM CONTENTS (Design Mode)
    // ========================================================================
    
    /** Fish in the aquarium */
    fish: [],
    
    /** Plants in the aquarium */
    plants: [],
    
    /** Decorations in the aquarium */
    decorations: [],
    
    /** Add a fish */
    addFish: (fishData) => {
      set((state) => ({
        fish: [...state.fish, { id: Date.now(), ...fishData }],
      }));
    },
    
    /** Remove a fish */
    removeFish: (fishId) => {
      set((state) => ({
        fish: state.fish.filter((f) => f.id !== fishId),
      }));
    },
    
    /** Add a plant */
    addPlant: (plantData) => {
      set((state) => ({
        plants: [...state.plants, { id: Date.now(), ...plantData }],
      }));
    },
    
    /** Add a decoration */
    addDecoration: (decorData) => {
      set((state) => ({
        decorations: [...state.decorations, { id: Date.now(), ...decorData }],
      }));
    },

    // ========================================================================
    // GUIDE SYSTEM
    // ========================================================================
    
    /** Current guide content based on mode */
    getGuideContent: () => {
      const { previousMode, mode } = get();
      const targetMode = previousMode || mode;
      
      const guides = {
        [FSM_MODES.IDLE]: {
          title: 'Welcome to Zen Aquarium',
          steps: [
            'Tap "Enter AR" to begin your aquarium journey',
            'Make sure you have good lighting in your space',
            'Clear a flat surface where you\'d like to place your tank',
          ],
          tips: 'For best results, use a sturdy table or stand.',
        },
        [FSM_MODES.SCANNING]: {
          title: 'Scanning Your Space',
          steps: [
            'Move your device slowly to scan the environment',
            'Look for flat, horizontal surfaces',
            'The green reticle shows valid placement spots',
            'Red reticle means the surface is too small',
          ],
          tips: `Your ${get().selectedTank.name} weighs ${get().getFilledWeight()}kg when filled. Ensure your surface can support this weight!`,
        },
        [FSM_MODES.PLACING]: {
          title: 'Placing Your Aquarium',
          steps: [
            'Position the tank preview where you want it',
            'The wireframe box shows required clearance above',
            'Tap to confirm placement when the reticle is green',
            'You can rotate the tank before confirming',
          ],
          tips: `Need ${CLEARANCE_ZONE_HEIGHT * 100}cm clearance above the tank for maintenance access.`,
        },
        [FSM_MODES.DESIGNING]: {
          title: 'Design Your Aquascape',
          steps: [
            'Add substrate, rocks, and driftwood first',
            'Plant your aquatic plants in the substrate',
            'Add fish last - don\'t overcrowd!',
            'Tap items to select, drag to position',
          ],
          tips: `Recommended: up to ${get().selectedTank.recommendedFish} small fish for your tank size.`,
        },
        [FSM_MODES.CARE]: {
          title: 'Caring for Your Fish',
          steps: [
            'Feed your fish when the hunger meter rises',
            'Clean the tank when algae builds up',
            'Happy fish swim actively and display bright colors',
            'Neglected fish become sluggish and pale',
          ],
          tips: 'Check on your aquarium daily for the happiest fish!',
        },
        [FSM_MODES.MENU]: {
          title: 'Menu',
          steps: [
            'Change your tank size',
            'Reset your aquarium',
            'Adjust settings',
            'Exit AR mode',
          ],
          tips: 'Your progress is saved automatically.',
        },
      };
      
      return guides[targetMode] || guides[FSM_MODES.IDLE];
    },

    // ========================================================================
    // XR SESSION STATE
    // ========================================================================
    
    /** Whether XR session is active */
    isXRActive: false,
    
    /** Set XR session state */
    setXRActive: (active) => set({ isXRActive: active }),
    
    /** Hit test result from WebXR */
    hitTestResult: null,
    
    /** Set hit test result */
    setHitTestResult: (result) => set({ hitTestResult: result }),

    // ========================================================================
    // RESET
    // ========================================================================
    
    /** Reset entire store to initial state */
    reset: () => {
      get().stopGameTick();
      set({
        mode: FSM_MODES.IDLE,
        previousMode: null,
        selectedTank: TANK_PRESETS.STANDARD,
        tankPosition: null,
        tankRotation: 0,
        safetyWarning: { active: false, type: null, message: '' },
        detectedSurface: { area: null, width: null, depth: null, isValid: false },
        hungerLevel: 0,
        algaeLevel: 0,
        fish: [],
        plants: [],
        decorations: [],
        isXRActive: false,
        hitTestResult: null,
      });
    },
  }))
);

export default useZenStore;
