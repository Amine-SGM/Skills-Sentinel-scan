# SkillGuard - AI Skill Security Scanner

## Overview
A web-based security scanner that analyzes AI agent skills for malicious code, vulnerabilities, and security threats before deployment. Uses dual-model analysis with Google AI Studio (Gemini) and OpenRouter.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + Shadcn UI
- **Backend**: Express.js
- **AI Models**: Gemini 2.5 Flash (via @google/genai) + OpenRouter (Llama 4 Maverick)
- **No database** - stateless tool, each scan is independent

## Key Features
- URL-based skill code fetching (GitHub, Gist, GitLab, Replit, etc.)
- Dual AI model security analysis
- Security score with vulnerability breakdown
- Automatic secured code generation for insecure skills
- API keys entered via UI (stored in localStorage)
- Dark/light theme toggle

## Project Structure
- `shared/schema.ts` - Zod schemas for scan requests/results
- `server/scanner.ts` - AI analysis logic (Gemini + OpenRouter)
- `server/routes.ts` - POST /api/scan endpoint
- `client/src/pages/home.tsx` - Main scanner page
- `client/src/components/` - UI components (settings, score, vulnerabilities, code viewer)
- `client/src/lib/api-keys.ts` - localStorage key management

## API Endpoints
- `POST /api/scan` - Accepts `{ skillUrl, geminiApiKey, openrouterApiKey }`, returns scan results

## Running
- `npm run dev` starts the Express server + Vite dev server on port 5000
