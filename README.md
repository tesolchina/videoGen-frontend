# Video Generator Frontend

Vue.js frontend for AI-powered video generation interface.

## Features

- 🎨 Modern Vue.js 3 + Vite interface
- 📝 Script input with real-time preview
- 🎬 Video generation controls
- 📱 Responsive design with Tailwind CSS
- ⚡ Fast development with HMR

## Quick Start

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Setup

Update the API base URL in `src/services/videoService.js` to point to your deployed backend:

```javascript
const API_BASE_URL = 'https://your-backend-url.railway.app'
```

## Railway Deployment

This repository is optimized for Railway deployment with:
- Automatic Node.js detection
- Vite build process
- Static file serving

Deploy to Railway: [Railway](https://railway.app)

## API Integration

The frontend communicates with the backend API for:
- Text-to-speech conversion
- Video generation
- Job status monitoring
- File management