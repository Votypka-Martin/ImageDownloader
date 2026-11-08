# Cosmos Image Downloader - Web Version (Node.js & Vercel)

A lightweight web application for searching, previewing, and downloading images from [cosmos.so](https://www.cosmos.so/), designed for local development and seamless deployment to Vercel.

---

## Educational Purpose

This application is created strictly for educational purposes to demonstrate how to interact with modern GraphQL endpoints and handle CORS via serverless functions, enabling users to access inspiration images from cosmos.so without requiring account creation.

---

## Features

- Serverless API Proxy: Queries `https://api.cosmos.so/graphql` via `/api/search` with the required browser headers to bypass CORS limitations.
- Continuous Pagination: Automatically requests the next batch of images as the user reaches the bottom of the page.
- Client-side ZIP Download: Generates a single `.zip` file containing all loaded images directly in the browser via JSZip and `/api/image`.
- Lightbox Modal: Full-resolution image viewer with dimension indicators and quick actions.
- Zero npm Runtime Dependencies: The local development server (`dev-server.js`) uses native Node.js standard libraries (`http`, `fs`, `path`, native `fetch`). No `npm install` needed.
- Raw Response Viewer: Inspect raw JSON data returned by the backend API.
- Clean Interface: Clean, professional UI without unicode icon clutter.

---

## Local Development

1. Open your terminal in the `web` folder:
   ```bash
   cd web
   ```

2. Start the local server:
   ```bash
   node dev-server.js
   ```

3. Open your browser at:
   `http://localhost:3000`

---

## Deployment to Vercel

### Option 1: GitHub Integration (Recommended)
1. Push your repository to GitHub.
2. Sign in to [vercel.com](https://vercel.com).
3. Click "Add New..." -> "Project".
4. Select your repository.
5. Set the "Root Directory" to `web`.
6. Click "Deploy".

### Option 2: Vercel CLI
```bash
cd web
npm i -g vercel
vercel
```
