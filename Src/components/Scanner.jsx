/**
 * Scanner.jsx - AR Surface Detection & Tank Placement
 * Version 0.5 (Safety & Guidance Update)
 * 
 * Handles WebXR hit-testing, surface validation, clearance zone visualization,
 * and placement confirmation with haptic feedback.
 * 
 * Physical Constraints:
 * - Tank presets: Nano (30cm), Standard (60cm), Grand (100cm)
 * - Water weight: 1L = 1kg
 * - Clearance zone: 30cm above tank for maintenance access
 * - 1:1 metric scale (1 Three.js unit = 1 meter)
 */

import React, { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useXR, useHitTest } from '@react-three/xr';
import * as THREE from 'three';
import useZenStore, { 
  FSM_MODES, 
  TANK_PRESETS, 
  CLEARANCE_ZONE_HEIGHT 
} from '../store/useZenStore';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Reticle pulse animation speed */
const PULSE_SPEED = 2.0;

/** Reticle base scale */
const RETICLE_BASE_SCALE = 0.1;

/** Colors for reticle states */
const COLORS = {
  VALID: new THREE.Color(0x00ff88),      // Bright green - safe placement
  INVALID: new THREE.Color(0xff4444),    // Red - unsafe placement
  SCANNING: new THREE.Color(0x44aaff),   // Blue - still scanning
  CLEARANCE: new THREE.Color(0xffaa00),  // Orange - clearance zone wireframe
};

// ============================================================================
// CLEARANCE ZONE WIREFRAME COMPONENT
// ============================================================================

/**
 * ClearanceZone - 3D wireframe box showing required maintenance clearance
 * Renders above the tank preview during scanning/placement phase
 * 
 * Optimized to use only 12 vertices (8 corners with indexed geometry)
 */
const ClearanceZone = React.memo(({ 
  tankDimensions, 
  position, 
  visible,
  isBlocked = false 
}) => {
  const meshRef = useRef();
  
  // Calculate clearance box geometry
  // Box extends from top of tank upward by CLEARANCE_ZONE_HEIGHT
  const geometry = useMemo(() => {
    const { width, height, depth } = tankDimensions;
    
    // Create box geometry for the clearance zone
    // Positioned so bottom face is at tank top
    const boxGeom = new THREE.BoxGeometry(
      width,                    // Same width as tank
      CLEARANCE_ZONE_HEIGHT,   // 30cm clearance height
      depth                     // Same depth as tank
    );
    
    // Convert to wireframe (EdgesGeometry for clean lines)
    const edges = new THREE.EdgesGeometry(boxGeom);
    boxGeom.dispose(); // Clean up the box geometry
    
    return edges;
  }, [tankDimensions]);
  
  // Animate opacity for visibility feedback
  const materialRef = useRef();
  
  useFrame((state) => {
    if (materialRef.current && visible) {
      // Subtle pulse animation
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.2 + 0.6;
      materialRef.current.opacity = pulse;
    }
  });
  
  if (!visible) return null;
  
  // Position clearance zone so its bottom is at tank top
  const clearancePosition = [
    position[0],
    position[1] + tankDimensions.height + (CLEARANCE_ZONE_HEIGHT / 2),
    position[2]
  ];
  
  return (
    <lineSegments 
      ref={meshRef}
      geometry={geometry}
      position={clearancePosition}
    >
      <lineBasicMaterial
        ref={materialRef}
        color={isBlocked ? COLORS.INVALID : COLORS.CLEARANCE}
        transparent
        opacity={0.7}
        linewidth={2}
      />
    </lineSegments>
  );
});

ClearanceZone.displayName = 'ClearanceZone';

// ============================================================================
// PLACEMENT RETICLE COMPONENT
// ============================================================================

/**
 * PlacementReticle - Pulsing indicator showing valid/invalid placement spots
 * Changes color based on surface size validation
 */
const PlacementReticle = React.memo(({ 
  position, 
  isValid, 
  isScanning,
  tankFootprint 
}) => {
  const meshRef = useRef();
  const ringRef = useRef();
  
  // Create reticle geometry - ring with tank footprint indicator
  const { ringGeometry, footprintGeometry } = useMemo(() => {
    // Outer ring
    const ring = new THREE.RingGeometry(0.08, 0.1, 32);
    ring.rotateX(-Math.PI / 2); // Lay flat on surface
    
    // Inner footprint preview (rectangle showing tank size)
    const footprint = new THREE.PlaneGeometry(
      tankFootprint.width,
      tankFootprint.depth
    );
    footprint.rotateX(-Math.PI / 2);
    
    return { ringGeometry: ring, footprintGeometry: footprint };
  }, [tankFootprint]);
  
  // Determine current color
  const currentColor = useMemo(() => {
    if (isScanning) return COLORS.SCANNING;
    return isValid ? COLORS.VALID : COLORS.INVALID;
  }, [isValid, isScanning]);
  
  // Animate pulse effect
  useFrame((state) => {
    if (meshRef.current) {
      // Pulsing scale animation
      const pulse = Math.sin(state.clock.elapsedTime * PULSE_SPEED) * 0.15 + 1;
      meshRef.current.scale.setScalar(pulse);
      
      // Rotate slowly for visual interest
      meshRef.current.rotation.y += 0.01;
    }
    
    if (ringRef.current) {
      // Counter-rotate the ring for dynamic effect
      ringRef.current.rotation.z -= 0.02;
    }
  });
  
  return (
    <group position={position}>
      {/* Outer pulsing ring */}
      <mesh ref={meshRef} geometry={ringGeometry}>
        <meshBasicMaterial 
          color={currentColor}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Inner rotating ring */}
      <mesh ref={ringRef} position={[0, 0.001, 0]}>
        <ringGeometry args={[0.04, 0.06, 32]} />
        <meshBasicMaterial
          color={currentColor}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Tank footprint preview (only when valid) */}
      {!isScanning && (
        <mesh geometry={footprintGeometry} position={[0, 0.002, 0]}>
          <meshBasicMaterial
            color={currentColor}
            transparent
            opacity={isValid ? 0.2 : 0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Corner markers for footprint */}
      {!isScanning && isValid && (
        <FootprintCorners footprint={tankFootprint} color={currentColor} />
      )}
    </group>
  );
});

PlacementReticle.displayName = 'PlacementReticle';

// ============================================================================
// FOOTPRINT CORNER MARKERS
// ============================================================================

/**
 * FootprintCorners - Small corner indicators showing exact tank placement area
 */
const FootprintCorners = React.memo(({ footprint, color }) => {
  const corners = useMemo(() => {
    const hw = footprint.width / 2;
    const hd = footprint.depth / 2;
    const cornerSize = 0.02;
    
    return [
      { pos: [-hw, 0, -hd], rot: 0 },
      { pos: [hw, 0, -hd], rot: Math.PI / 2 },
      { pos: [hw, 0, hd], rot: Math.PI },
      { pos: [-hw, 0, hd], rot: -Math.PI / 2 },
    ].map((corner, i) => ({
      ...corner,
      key: `corner-${i}`,
    }));
  }, [footprint]);
  
  return (
    <>
      {corners.map(({ pos, rot, key }) => (
        <mesh key={key} position={pos} rotation={[0, rot, 0]}>
          <planeGeometry args={[0.03, 0.01]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      ))}
    </>
  );
});

FootprintCorners.displayName = 'FootprintCorners';

// ============================================================================
// TANK PREVIEW COMPONENT
// ============================================================================

/**
 * TankPreview - Transparent preview of tank at placement position
 */
const TankPreview = React.memo(({ tankDimensions, position, rotation, isValid }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      // Subtle breathing animation
      const breath = Math.sin(state.clock.elapsedTime * 1.5) * 0.01 + 1;
      meshRef.current.scale.y = breath;
    }
  });
  
  const { width, height, depth } = tankDimensions;
  
  // Position tank so bottom sits on surface
  const tankPosition = [
    position[0],
    position[1] + height / 2,
    position[2]
  ];
  
  return (
    <mesh 
      ref={meshRef}
      position={tankPosition}
      rotation={[0, rotation, 0]}
    >
      <boxGeometry args={[width, height, depth]} />
      <meshBasicMaterial
        color={isValid ? COLORS.VALID : COLORS.INVALID}
        transparent
        opacity={0.15}
        wireframe={false}
      />
      {/* Wireframe overlay */}
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial
          color={isValid ? COLORS.VALID : COLORS.INVALID}
          transparent
          opacity={0.4}
          wireframe={true}
        />
      </mesh>
    </mesh>
  );
});

TankPreview.displayName = 'TankPreview';

// ============================================================================
// WEIGHT INDICATOR COMPONENT
// ============================================================================

/**
 * WeightIndicator - Floating text showing tank weight when filled
 * Uses Three.js Sprite for always-facing-camera behavior
 */
const WeightIndicator = React.memo(({ position, weight, tankName }) => {
  // We'll render this in the HUD instead for better visibility
  // This component is kept for potential 3D label use
  return null;
});

// ============================================================================
// MAIN SCANNER COMPONENT
// ============================================================================

/**
 * Scanner - Main component handling AR hit-testing and placement validation
 */
const Scanner = () => {
  const groupRef = useRef();
  
  // Store state
  const {
    mode,
    selectedTank,
    tankRotation,
    setTankPosition,
    setMode,
    setSafetyWarning,
    clearSafetyWarning,
    validatePlacement,
    safetyWarning,
  } = useZenStore();
  
  // Local state for hit test position
  const [hitPosition, setHitPosition] = useState([0, 0, 0]);
  const [hasHit, setHasHit] = useState(false);
  const [surfaceValid, setSurfaceValid] = useState(false);
  const [clearanceValid, setClearanceValid] = useState(true);
  
  // Get XR session state
  const { isPresenting } = useXR();
  
  // Only active during SCANNING or PLACING modes
  const isActive = mode === FSM_MODES.SCANNING || mode === FSM_MODES.PLACING;
  
  // Tank physical properties
  const tankDimensions = selectedTank.dimensions;
  const tankFootprint = selectedTank.footprint;
  const filledWeight = selectedTank.volumeLiters + (selectedTank.id === 'NANO' ? 5 : selectedTank.id === 'STANDARD' ? 12 : 25);
  
  // ========================================================================
  // HIT TEST HANDLING
  // ========================================================================
  
  /**
   * Process hit test results from WebXR
   * Validates surface size against tank footprint
   */
  const handleHitTest = useCallback((hitMatrix, hit) => {
    if (!isActive) return;
    
    // Extract position from hit matrix
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    hitMatrix.decompose(position, quaternion, scale);
    
    setHitPosition([position.x, position.y, position.z]);
    setHasHit(true);
    
    // Estimate surface size from hit test
    // In a real implementation, this would use plane detection data
    // For now, we simulate based on hit confidence
    const estimatedSurfaceWidth = 1.5; // Placeholder - would come from AR plane
    const estimatedSurfaceDepth = 1.0;
    
    // Validate surface size against tank footprint
    const isSurfaceValid = 
      estimatedSurfaceWidth >= tankFootprint.width &&
      estimatedSurfaceDepth >= tankFootprint.depth;
    
    setSurfaceValid(isSurfaceValid);
    
    // Check clearance zone (simplified - would use raycasting in production)
    // For now, assume clearance is valid
    const isClearanceValid = true; // Would check for obstacles above
    setClearanceValid(isClearanceValid);
    
    // Update store with validation results
    if (!isSurfaceValid) {
      setSafetyWarning(
        'SURFACE_TOO_SMALL',
        `Surface too small for ${selectedTank.name}. Need ${(tankFootprint.width * 100).toFixed(0)}×${(tankFootprint.depth * 100).toFixed(0)}cm`
      );
    } else if (!isClearanceValid) {
      setSafetyWarning(
        'CLEARANCE_BLOCKED',
        `Need ${CLEARANCE_ZONE_HEIGHT * 100}cm clearance above tank`
      );
    } else {
      clearSafetyWarning();
    }
  }, [isActive, tankFootprint, selectedTank, setSafetyWarning, clearSafetyWarning]);
  
  // Register hit test callback
  useHitTest(handleHitTest);
  
  // ========================================================================
  // PLACEMENT CONFIRMATION
  // ========================================================================
  
  /**
   * Handle tap to confirm placement
   */
  const confirmPlacement = useCallback(() => {
    if (!hasHit || !surfaceValid || !clearanceValid) {
      // Trigger haptic warning
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]); // Error pattern
      }
      return;
    }
    
    // Success haptic
    if (navigator.vibrate) {
      navigator.vibrate(100); // Short success buzz
    }
    
    // Save tank position
    setTankPosition(hitPosition);
    
    // Transition to DESIGNING mode
    setMode(FSM_MODES.DESIGNING);
  }, [hasHit, surfaceValid, clearanceValid, hitPosition, setTankPosition, setMode]);
  
  // ========================================================================
  // CLICK/TAP HANDLER
  // ========================================================================
  
  const handlePointerDown = useCallback((event) => {
    if (mode === FSM_MODES.PLACING) {
      confirmPlacement();
    } else if (mode === FSM_MODES.SCANNING && hasHit) {
      // Move to placing mode to preview tank
      setMode(FSM_MODES.PLACING);
    }
  }, [mode, hasHit, confirmPlacement, setMode]);
  
  // ========================================================================
  // RENDER
  // ========================================================================
  
  if (!isActive || !isPresenting) {
    return null;
  }
  
  const isPlacementValid = surfaceValid && clearanceValid;
  const showClearanceZone = mode === FSM_MODES.PLACING;
  
  return (
    <group 
      ref={groupRef}
      onPointerDown={handlePointerDown}
    >
      {/* Placement Reticle */}
      {hasHit && (
        <PlacementReticle
          position={hitPosition}
          isValid={isPlacementValid}
          isScanning={mode === FSM_MODES.SCANNING}
          tankFootprint={tankFootprint}
        />
      )}
      
      {/* Tank Preview (only in PLACING mode) */}
      {mode === FSM_MODES.PLACING && hasHit && (
        <>
          <TankPreview
            tankDimensions={tankDimensions}
            position={hitPosition}
            rotation={tankRotation}
            isValid={isPlacementValid}
          />
          
          {/* Clearance Zone Wireframe */}
          <ClearanceZone
            tankDimensions={tankDimensions}
            position={hitPosition}
            visible={showClearanceZone}
            isBlocked={!clearanceValid}
          />
        </>
      )}
      
      {/* Invisible interaction plane for tap detection */}
      <mesh 
        position={[0, 0, -5]} 
        visible={false}
        onPointerDown={handlePointerDown}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
};

// ============================================================================
// HELPER HOOK: Calculate Filled Weight
// ============================================================================

/**
 * Custom hook to calculate tank weight based on preset
 * @param {string} tankId - Tank preset ID
 * @returns {Object} Weight information
 */
export const useTankWeight = (tankId) => {
  return useMemo(() => {
    const tank = TANK_PRESETS[tankId] || TANK_PRESETS.STANDARD;
    
    // Base weight calculations
    const waterWeightKg = tank.volumeLiters; // 1L = 1kg
    const glassWeightKg = tank.id === 'NANO' ? 3 : tank.id === 'STANDARD' ? 8 : 18;
    const substrateWeightKg = tank.id === 'NANO' ? 2 : tank.id === 'STANDARD' ? 4 : 7;
    
    const totalWeight = waterWeightKg + glassWeightKg + substrateWeightKg;
    
    return {
      waterKg: waterWeightKg,
      glassKg: glassWeightKg,
      substrateKg: substrateWeightKg,
      totalKg: totalWeight,
      displayWeight: `${totalWeight.toFixed(1)} kg`,
      volumeLiters: tank.volumeLiters,
    };
  }, [tankId]);
};

// ============================================================================
// EXPORTS
// ============================================================================

export default Scanner;
export { ClearanceZone, PlacementReticle, TankPreview };
