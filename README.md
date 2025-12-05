# Booking System - Frontend Dashboard

Modern booking dashboard built with Next.js 15, TypeScript, and Material UI v6. 
This is not a production system but shall only serve as a proof of concept. 
It is designed to be enhanced to work with an external user management and payment service in the future.

## Prerequisites

- **Node.js**: v20+ (LTS)
- **NPM/Yarn/PNPM**

## Quick Start

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Environment Setup

Configure the connection to the Backend service.

```bash
echo "BACKEND_INTERNAL_URL=http://localhost:8000" > .env.local
```

### 3. Development Server

Start the development server with hot-reloading at `http://localhost:3000`.

```bash
npm run dev
```

### 4. Production Build

Compile and start the production-optimized server.

```bash
npm run build
npm start
```

## Key Features

- **Admin Dashboard**: `/en/admin`
- **Tenant Login**: `/en/admin/login/[slug]`
- **Public Booking**: `/en/book/[tenantId]/[slug]`