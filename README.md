# GHL Voice AI Builder

A comprehensive monorepo for building, training, and deploying Go High Level voice AI agents.

## 🏗️ Structure

```
GHL-VOICE-AI-BUILDER/
├── apps/
│   ├── web/              # Frontend (Vite + React + TypeScript)
│   └── server/           # Backend (Express + MCP, JavaScript)
├── packages/
│   ├── shared/           # Shared types and utilities
│   ├── evaluation/       # Evaluation system (golden datasets, rubrics)
│   └── promptkit/        # Prompt composition and spec management
├── docs/
│   ├── INVENTORY.md      # Detailed repository inventory
│   └── inventory.json    # Machine-readable inventory
├── scripts/
│   └── inventory.js      # Repo inventory generator
├── package.json          # Root workspace config
└── render.yaml           # Deployment configuration
```

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm ci

# Start frontend dev server
npm run dev:web

# Start backend server (separate terminal)
npm run dev:server
```

### Building

```bash
# Build frontend for production
npm run build

# Verify build output
npm run build:verify
```

### Deployment

Deployed to Render.com. Push to `main` branch triggers automatic deployment.

## 📦 Apps

### apps/web
React + TypeScript frontend with:
- Training Hub for agent development
- Conversation simulator
- Golden dataset management
- Confidence-gated observability
- Real-time evaluation system

### apps/server
Express.js backend with:
- GHL API integration
- MCP (Model Context Protocol) server
- Prompt composition engine
- Turn-by-turn analyzer
- Webhook handlers

## 📚 Packages

### packages/shared
Shared TypeScript types used across apps

### packages/evaluation
Evaluation system including:
- Session evaluator
- Rubric scoring
- Golden dataset utilities
- Auto-correction system

### packages/promptkit
Prompt management tools:
- Prompt composer
- Spec extraction/embedding
- Template library

## 🔧 Scripts

- `npm run build` - Build frontend
- `npm run dev:web` - Start dev server
- `npm run dev:server` - Start backend
- `npm run typecheck` - Type check TypeScript
- `npm run repo:inventory` - Generate repo inventory
- `npm run test` - Run tests

## 📝 Documentation

See `/docs` folder for:
- `INVENTORY.md` - Complete repository inventory
- `inventory.json` - Machine-readable catalog

## 🔐 Environment Variables

Required for production (set in Render dashboard):
- `GHL_CLIENT_ID` - Go High Level OAuth client ID
- `GHL_CLIENT_SECRET` - OAuth client secret
- `GHL_SHARED_SECRET` - Webhook shared secret
- `DATABASE_URL` - Database connection string (if using)

## 📄 License

ISC

