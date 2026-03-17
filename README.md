# Aquarium-app
# 🐠 Zen Aquarium

[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR-BADGE-ID/deploy-status)](https://app.netlify.com/sites/YOUR-SITE/deploys)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r169-black?logo=three.js)](https://threejs.org/)
[![WebXR](https://img.shields.io/badge/WebXR-AR-ff6f00)](https://immersiveweb.dev/)

> An immersive Augmented Reality aquarium experience built with React, Three.js, and WebXR. Place a virtual aquarium in your real-world space, design your aquascape, and care for your fish.

![Zen Aquarium Preview](https://via.placeholder.com/800x400/0d9488/ffffff?text=Zen+Aquarium+AR)

## ✨ Features

### 🔍 AR Surface Detection
- Real-time hit-testing to find flat surfaces
- Visual reticle with color feedback (green = valid, red = invalid)
- Surface size validation against tank footprint

### 🏗️ Physical Constraints System
- **Tank Presets**: Nano (30cm), Standard (60cm), Grand (100cm)
- **Weight Calculation**: Accurate water weight (1L = 1kg) + glass + substrate
- **Clearance Zone**: 30cm wireframe box for maintenance access visualization
- **Haptic Feedback**: Vibration alerts for invalid placements

### 🎮 7-Mode Finite State Machine
| Mode | Description |
|------|-------------|
| `IDLE` | Initial state, waiting for XR session |
| `SCANNING` | AR hit-testing, surface detection |
| `PLACING` | Tank placement with constraint validation |
| `DESIGNING` | Aquascaping: plants, decor, fish selection |
| `CARE` | Active game loop: feeding, cleaning |
| `MENU` | Pause menu overlay |
| `GUIDE` | Contextual tutorial system |

### 🎯 Zen Care Game Loop
- Hunger decay system requiring regular feeding
- Algae growth requiring tank cleaning
- Fish happiness derived from care metrics
- Auto-pause when Guide or Menu is active

### 💎 Glassmorphism UI
- Floating Action Button (FAB) with blur effects
- Contextual guide overlays for each mode
- Safety warning banners with haptic feedback
- Care meters with circular progress indicators

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Three.js r169** - 3D graphics
- **React-Three-Fiber** - React renderer for Three.js
- **@react-three/xr** - WebXR integration
- **Zustand** - State management
- **Tailwind CSS** - Styling

## 📁 Project Structure

```
zen-aquarium/
├── public/
│   ├── _headers          # Netlify headers (WebXR permissions)
│   └── _redirects        # SPA routing
├── src/
│   ├── components/
│   │   ├── Scanner.jsx   # AR hit-testing & placement
│   │   └── HUD.jsx       # UI overlay & guide system
│   ├── store/
│   │   └── useZenStore.js # Zustand state management
│   └── styles/
│       └── hud-animations.css # Animation keyframes
├── netlify.toml          # Netlify deployment config
├── tailwind.config.extension.js # Tailwind theme extensions
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A WebXR-compatible device (Android with Chrome, or iOS with WebXR Viewer)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/zen-aquarium.git
cd zen-aquarium

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development

```bash
# Run dev server (usually on port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 WebXR Requirements

WebXR requires HTTPS. For local development with AR features:

```bash
# Option 1: Use ngrok for HTTPS tunnel
ngrok http 5173

# Option 2: Use Vite's HTTPS mode
# Add to vite.config.js:
# server: { https: true }
```

## 🌐 Deployment (Netlify)

### Automatic Deployment

1. Connect your GitHub repo to Netlify
2. Netlify will auto-detect Vite and use `netlify.toml` settings
3. Deploy!

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### Environment Variables

The `netlify.toml` is pre-configured with:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--include=dev"  # Required for Vite
```

## 🎨 Customization

### Adding New Tank Presets

Edit `src/store/useZenStore.js`:

```javascript
export const TANK_PRESETS = {
  // Add your custom tank
  CUSTOM: {
    id: 'CUSTOM',
    name: 'Custom Tank',
    dimensions: { width: 0.80, height: 0.45, depth: 0.35 },
    volumeLiters: 126,
    get filledWeightKg() { return this.volumeLiters + 15; },
    footprint: { width: 0.80, depth: 0.35 },
    recommendedFish: 20,
    description: 'Your custom tank',
  },
};
```

### Tailwind Configuration

Merge `tailwind.config.extension.js` into your `tailwind.config.js`:

```javascript
// tailwind.config.js
const zenExtensions = require('./tailwind.config.extension.js');

module.exports = {
  // ...your config
  theme: {
    extend: {
      ...zenExtensions.theme.extend,
    },
  },
};
```

## 📐 Technical Notes

### 1:1 Metric Scale
All measurements use real-world meters (1 Three.js unit = 1 meter):
- Nano tank: 0.30m × 0.30m × 0.30m
- Standard tank: 0.60m × 0.40m × 0.30m
- Grand tank: 1.00m × 0.50m × 0.40m

### Clearance Zone Optimization
The wireframe uses `EdgesGeometry` for minimal vertex count (12 vertices).

### Haptic Patterns
```javascript
// Warning vibration
navigator.vibrate([100, 50, 100]);

// Error vibration
navigator.vibrate([200, 100, 200]);

// Success vibration
navigator.vibrate(100);
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React-Three-Fiber](https://github.com/pmndrs/react-three-fiber) - Amazing React renderer for Three.js
- [Zustand](https://github.com/pmndrs/zustand) - Simple and fast state management
- [WebXR](https://immersiveweb.dev/) - Immersive web standards

---

<p align="center">
  Made with 💙 and 🐠
</p>

