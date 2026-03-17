/**
 * tailwind.config.extension.js
 * Zen Aquarium v0.5 - Tailwind CSS Configuration Extension
 * 
 * Merge these values into your existing tailwind.config.js
 */

module.exports = {
  theme: {
    extend: {
      // Animation keyframes
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
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(20, 184, 166, 0.4)' },
          '50%': { boxShadow: '0 0 20px 10px rgba(20, 184, 166, 0)' },
        },
        ripple: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
      },
      
      // Animation utility classes
      animation: {
        'fadeIn': 'fadeIn 0.2s ease-out forwards',
        'scaleIn': 'scaleIn 0.3s ease-out forwards',
        'slideDown': 'slideDown 0.3s ease-out forwards',
        'slideUp': 'slideUp 0.3s ease-out forwards',
        'slideRight': 'slideRight 0.3s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'ripple': 'ripple 1s ease-out infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
      },
      
      // Custom colors for Zen Aquarium
      colors: {
        zen: {
          teal: {
            50: '#f0fdfa',
            100: '#ccfbf1',
            200: '#99f6e4',
            300: '#5eead4',
            400: '#2dd4bf',
            500: '#14b8a6',
            600: '#0d9488',
            700: '#0f766e',
            800: '#115e59',
            900: '#134e4a',
          },
          cyan: {
            50: '#ecfeff',
            100: '#cffafe',
            200: '#a5f3fc',
            300: '#67e8f9',
            400: '#22d3ee',
            500: '#06b6d4',
            600: '#0891b2',
            700: '#0e7490',
            800: '#155e75',
            900: '#164e63',
          },
          warning: '#f59e0b',
          danger: '#ef4444',
          success: '#22c55e',
        },
      },
      
      // Glassmorphism-friendly backdrop blur values
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
      },
      
      // Custom box shadows
      boxShadow: {
        'glow-teal': '0 0 20px rgba(20, 184, 166, 0.3)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.3)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 15px 50px rgba(0, 0, 0, 0.15)',
      },
      
      // Border radius presets
      borderRadius: {
        'glass': '1rem',
        'fab': '50%',
      },
      
      // Z-index scale
      zIndex: {
        'hud': '30',
        'fab': '40',
        'overlay': '50',
        'guide': '60',
      },
    },
  },
  
  // Add safelist for dynamically generated classes
  safelist: [
    'animate-fadeIn',
    'animate-scaleIn',
    'animate-slideDown',
    'animate-slideUp',
    'animate-slideRight',
    'animate-pulse-glow',
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-blue-500',
    'bg-teal-500',
    'bg-purple-500',
    'bg-gray-500',
    'bg-gray-600',
    'bg-amber-500',
  ],
};
