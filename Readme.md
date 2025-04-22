# Comparely Monorepo

This repository contains three main services that power the Comparely platform:

- **/mobile**: React Native (Expo, TypeScript) app
- **/backend-go**: Backend API using Gin (Go)
- **/ginger**: Search Intelligence and AI platform using Python, FastAPI, and Docker

---

## Prerequisites

- **Node.js & npm** (for `/mobile`)
- **Go** (for `/backend-go`)
- **Docker & Docker Compose** (for `/ginger`)

---

## Services & Local Setup

### 1. Mobile App (`/mobile`)

- **Framework**: Expo (React Native)
- **Language**: TypeScript

#### Running Locally

1. Rename `.env.example` to `.env`.
2. (Optional) To use the production backend, add the following in your `.env`:
   ```ini
   EXPO_PUBLIC_API_URL="https://grocery-api.comparely.co.in/"
   ```
3. Install dependencies and start Expo:
   ```bash
   cd mobile
   npm install
   npm run start
   ```

---

### 2. Backend API (`/backend-go`)

- **Framework**: Gin
- **Language**: Go

#### Running Locally

1. Install Go (version 1.24+).
2. Rename `.env.example` to `.env`.
3. Start the server:
   ```bash
   cd backend-go
   go run .
   ```

---

### 3. Search Intelligence: Ginger (`/ginger`)

- **Framework**: FastAPI
- **Language**: Python
- **Orchestration**: Docker Compose

#### Running Locally

1. Navigate to the `ginger` directory and build:
   ```bash
   cd ginger
   docker-compose up --build
   ```
2. **Note**: Ginger includes its own Redis image. If you have a local Redis service running, stop it to avoid port conflicts.

3. **Note**: We don't provide any venv or conda env by default, hence we recommend you to run `ginger` using Docker only.

---

## Important

All three services **must** be running simultaneously for the application to function correctly.

