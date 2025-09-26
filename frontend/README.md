# Draw It - AI-Powered Drawing Application

A modern drawing application built with React, TypeScript, and Vite, featuring AI-powered drawing generation using Google's Gemini API.

## Features

- 🎨 **Drawing Tools**: Rectangle, Ellipse, Line, Arrow, Freehand, Text, Diamond, Image, Embed
- 🤖 **AI Generation**: Generate drawings using natural language prompts with Gemini AI
- 🎯 **Real-time Collaboration**: WebSocket-based collaborative drawing
- 🌙 **Dark/Light Theme**: Automatic theme switching with persistence
- 💾 **Export Options**: PNG, SVG, and JSON export formats
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Environment Setup

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Backend API
VITE_BACKEND_URL=http://localhost:3000

# AI Drawing Generation (Optional)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Clerk Authentication Setup

1. **Get Clerk Keys**:

   - Visit [Clerk Dashboard](https://dashboard.clerk.com/)
   - Create a new application
   - Copy your Publishable Key

2. **Configure Clerk**:
   - Add your Clerk Publishable Key to the `.env` file
   - The app will automatically handle authentication flows

### AI Drawing Generation Setup

To enable AI-powered drawing generation, you'll need to configure the Gemini API:

1. **Get a Gemini API Key**:

   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key

2. **Configure Environment Variables**:
   Add the Gemini API key to your `.env` file

3. **Usage**:
   - Click the ✨ "Generate Drawing" tool in the toolbar
   - Enter a descriptive prompt (e.g., "Draw a house with a garden, trees, and a sun in the sky")
   - Click "Generate" to create AI-generated drawing elements
   - The generated elements will be positioned in your current viewport

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
npm run dev
```

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
