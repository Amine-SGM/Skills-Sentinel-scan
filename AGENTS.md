# AGENTS.md - SkillGuard Development Guide

Guidelines for agentic coding agents working in this repository.

## Project Overview

SkillGuard is a web-based security scanner that analyzes AI agent skills for malicious code, vulnerabilities, and security threats. Users can select from multiple AI providers (Gemini, OpenRouter, Pollinations.ai) with customizable model selection.

## Build/Lint/Test Commands

```bash
npm run dev          # Start dev server on port 5000 (Express + Vite)
npm run build        # Production build to dist/
npm run start        # Run production server
npm run check        # TypeScript type checking (tsc)
npm run db:push      # Push Drizzle schema changes (if using DB)
```

**No test framework is currently configured.** If tests are added, check package.json for the test command.

## Architecture

| Layer | Tech Stack |
|-------|------------|
| Frontend | React 18 + Vite + TailwindCSS + Shadcn UI |
| Backend | Express.js (ESM) |
| AI Providers | Gemini, OpenRouter, Pollinations.ai (user-selectable) |
| State | Stateless - each scan is independent, API keys in localStorage |

**Port**: Development and production both serve on port 5000 (or `PORT` env var).

## Project Structure

```
├── client/src/
│   ├── components/
│   │   ├── ui/              # Shadcn UI components (auto-generated)
│   │   ├── settings-dialog.tsx  # Provider/model/API key configuration
│   │   ├── security-score.tsx   # Score visualization
│   │   ├── vulnerability-list.tsx
│   │   └── code-viewer.tsx
│   ├── pages/
│   │   └── home.tsx         # Main scanner page
│   ├── lib/
│   │   ├── api-keys.ts      # localStorage provider/model/key management
│   │   ├── queryClient.ts   # Fetch wrapper for API calls
│   │   └── utils.ts         # Tailwind class utilities
│   └── hooks/
│       └── use-toast.ts     # Toast notifications
├── server/
│   ├── index.ts             # Express app entry point
│   ├── routes.ts            # API route definitions
│   ├── scanner.ts           # AI provider analysis logic
│   ├── vite.ts              # Vite dev server integration
│   └── static.ts            # Production static file serving
├── shared/
│   └── schema.ts            # Zod schemas for request/result types
├── agent.md                 # Project documentation
└── AGENTS.md                # This file
```

## Code Style Guidelines

### Imports

Group imports in this order, separated by blank lines:

1. External packages (React, Express, Zod, etc.)
2. Internal aliases (`@/`, `@shared/`)
3. Relative imports (`./`, `../`)

```typescript
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import type { ScanResult } from "@shared/schema";

import { localHelper } from "./utils";
```

### Formatting

- **Indentation**: 2 spaces
- **Quotes**: Double quotes for JSX attributes, single quotes for JS strings
- **Semicolons**: Required
- **Trailing commas**: ES5 (no trailing commas in function parameters)
- **Line width**: 100 characters preferred

### TypeScript

- **Strict mode**: Enabled (`strict: true` in tsconfig.json)
- **Type annotations**: Required for function parameters and return types in signatures
- **Avoid `any`**: Use `unknown` with type guards, or define proper types
- **Use `type` for object types, `interface` only when extending**

```typescript
type ScanConfig = {
  provider: Provider;
  apiKey: string;
  model?: string;
};

function scanSkill(url: string, config: ScanConfig): Promise<ScanResult> {
  // ...
}
```

### Naming Conventions

| Kind | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `SettingsDialog`, `SecurityScore` |
| Functions | camelCase | `scanSkill`, `fetchSkillCode` |
| Constants | SCREAMING_SNAKE | `ALLOWED_HOSTS`, `SECURITY_PROMPT` |
| Types/Schemas | PascalCase + suffix | `ScanResult`, `scanRequestSchema` |
| Files | kebab-case | `settings-dialog.tsx`, `api-keys.ts` |
| CSS classes | kebab-case (Tailwind) | `bg-primary`, `text-muted-foreground` |

### Error Handling

- Use Zod `.safeParse()` for validation, return 400 with field errors
- Wrap async route handlers in try/catch, return 500 with message
- Log errors to console with `console.error()`
- Show user-friendly errors via toast notifications

```typescript
app.post("/api/scan", async (req, res) => {
  try {
    const parsed = scanRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: parsed.error.flatten().fieldErrors,
      });
    }
    // ... handle success
  } catch (error: unknown) {
    console.error("Scan error:", error);
    res.status(500).json({ error: "Failed to scan skill" });
  }
});
```

### React Patterns

- Use functional components with hooks
- Destructure props at function signature
- Use `data-testid` attributes for testable elements
- Prefer controlled components over uncontrolled

```typescript
type Props = {
  score: number;
  size?: "sm" | "lg";
};

export function SecurityScore({ score, size = "sm" }: Props) {
  return (
    <div data-testid="security-score">
      {/* ... */}
    </div>
  );
}
```

### API Patterns

- RESTful endpoints under `/api/`
- Use Zod schemas in `shared/schema.ts` for request/response validation
- Return JSON with consistent structure

```typescript
// Success
res.json({ id, result, ... });

// Error
res.status(400).json({ error: "Message", details: { ... } });
```

### CSS/Styling

- Use Tailwind utility classes exclusively
- Use Shadcn UI components from `@/components/ui/`
- Follow existing color patterns: `primary`, `destructive`, `muted`, `background`
- Dark mode: Use `next-themes` ThemeProvider, colors via CSS variables

## AI Provider Configuration

Users select provider and model in Settings. Three providers supported:

| Provider | Default Model | API Key Source |
|----------|---------------|----------------|
| Gemini | `gemini-2.5-flash` | aistudio.google.com |
| OpenRouter | `meta-llama/llama-4-maverick` | openrouter.ai |
| Pollinations | `openai` | enter.pollinations.ai |

Scanner dispatches to provider-specific implementation based on `provider` field.

## Security Considerations

- API keys are stored in browser localStorage (client-side only)
- Never log or expose API keys in server responses
- URL validation restricts to allowed hosts (GitHub, GitLab, Gist, etc.)
- All inputs validated with Zod before processing

## Common Tasks

**Add new UI component:**
1. Check if Shadcn component exists in `@/components/ui/`
2. If not, add via `npx shadcn@latest add <component>`
3. Import and use in page/component

**Add new API endpoint:**
1. Define Zod schema in `shared/schema.ts`
2. Add route handler in `server/routes.ts`
3. Export types from schema for frontend use

**Modify AI provider logic:**
1. Update `server/scanner.ts` - add provider config and analyzer function
2. Update `client/src/components/settings-dialog.tsx` - add to provider dropdown
3. Update `shared/schema.ts` - add to provider enum
