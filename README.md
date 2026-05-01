# GestureAI

GestureAI is a Next-Gen, zero-latency American Sign Language (ASL) translator powered by MediaPipe and a Random Forest machine learning model. It runs 100% on the client-side, ensuring total privacy and lightning-fast translation speeds directly in the browser.

## Deploying to Vercel

This repository is **Vercel-Ready**.

Since the Next.js web application is located inside the `web-app` subdirectory, you can deploy this entire repository (including the Python training scripts) to Vercel without changing the folder structure. 

### Method 1: Deploying via Vercel Dashboard (Recommended)

1. Push this entire repository (`GestureAI_Final`) to your GitHub.
2. Go to your [Vercel Dashboard](https://vercel.com/new) and click **"Add New Project"**.
3. Import your GitHub repository.
4. **Crucial Step:** In the **"Root Directory"** setting, click `Edit` and select `web-app`.
5. Vercel will automatically detect Next.js. Keep the default Build and Install commands.
6. Click **Deploy**.

### Method 2: Deploying from CLI

If you use the Vercel CLI, simply run:

```bash
npm i -g vercel
vercel
```

*(Note: The included `vercel.json` file in the root directory provides hints to Vercel, but setting the Root Directory via the dashboard is always the most bulletproof approach).*

## Features

- ⚡ **Zero Latency:** Translations happen client-side using WebAssembly and WebGL.
- 🔒 **100% Private:** Your webcam feed never leaves your device.
- 🔊 **Text-to-Speech:** Listen to the translated sentence instantly.
- 📋 **Copy & Download:** Easily copy text to your clipboard or download it as a `.txt` file.
- ✨ **SaaS-Grade UI:** Built with Next.js 15, Tailwind CSS, Framer Motion, and Lucide React.
