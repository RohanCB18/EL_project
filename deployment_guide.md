# Vercel Deployment Guide for EduConnect

## Overview
This guide will help you deploy the **frontend** of the EduConnect application to Vercel.

Since your backend currently runs locally (`localhost:5000`), the deployed frontend on Vercel **will not be able to communicate with it** unless:
1.  **Option A (Recommended for Production):** You deploy the backend to a cloud provider (Render, Railway, Heroku, etc.).
2.  **Option B (Testing only):** You use a tunneling service (like ngrok) to expose your local backend to the internet.

## Prerequisites
- A GitHub account.
- A Vercel account (linked to GitHub).
- The project pushed to a GitHub repository.

## Step 1: Configure Environment Variables

The application is now configured to look for the API URL in an environment variable named `NEXT_PUBLIC_API_URL`.

1.  Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your `EL_project` repository.
4.  In the **"Configure Project"** screen, find the **"Environment Variables"** section.
5.  Add the following variable:
    -   **Key**: `NEXT_PUBLIC_API_URL`
    -   **Value**:
        -   If deploying backend: `https://your-backend-app.onrender.com` (or similar)
        -   If testing with ngrok: `https://your-ngrok-url.ngrok-free.app`
        -   *Note: Do NOT use `localhost:5000` here.*

## Step 2: Deploy
1.  Click **"Deploy"**.
2.  Vercel will build your Next.js application.
3.  Once finished, you will get a live URL (e.g., `https://el-project.vercel.app`).

## Backend Considerations
Your backend is an Express.js app connecting to PostgreSQL. Vercel is primarily for frontends and serverless functions.
**Recommendation:** Deploy the backend to **Render.com** (it has a free tier for Node.js services and PostgreSQL databases).

### If deploying backend to Render:
1.  Create a new **Web Service** on Render connected to your repo.
2.  Set the Root Directory to `backend` (if possible) or ensure the build command runs `npm install` inside the `backend` folder.
3.  Set the start command to `node server.js`.
4.  Add your database credentials (`PGUSER`, `PGHOST`, etc.) as Environment Variables in Render.
