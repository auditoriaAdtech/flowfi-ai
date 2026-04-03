# FlowFi AI - Personal Finance SaaS

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### 1. Start Infrastructure
```bash
cd flowfi-ai
docker-compose up -d
```
This starts PostgreSQL, Redis, and MinIO.

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
npm run dev
```
API runs at http://localhost:3001/api
Swagger docs at http://localhost:3001/api/docs

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
App runs at http://localhost:3000

### Demo Login
- Email: demo@flowfi.ai
- Password: demo123

## Architecture
- **Frontend**: Next.js 14 + TypeScript + Tailwind + shadcn/ui
- **Backend**: NestJS + Prisma + PostgreSQL
- **i18n**: English + Spanish (LATAM)
- **AI**: Mock responses (ready for OpenAI integration)

## Pricing Tiers
- Starter: $5/mo
- Pro: $10/mo
- Premium: $25/mo
- Corporate: Custom
