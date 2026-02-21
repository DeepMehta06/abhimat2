# Complete Deployment Guide: Abhimat 2026

This guide provides step-by-step instructions to deploy the Abhimat 2026 project. The project consists of:
1.  **Frontend (Client)**: React + Vite + Tailwind CSS
2.  **Backend (Server)**: Node.js + Express
3.  **Database**: Supabase (PostgreSQL)

## Architecture & Hosting Recommendations
*   **Database**: Supabase (Free tier is sufficient for most events)
*   **Backend**: Render (Web Service - Free or Starter tier) or Railway
*   **Frontend**: Netlify or Vercel (Free tier)

---

## Part 1: Supabase Setup (Database)
1. Go to [Supabase](https://supabase.com) and create a new project.
2. Save your **Database Password** securely.
3. Once the project is created, navigate to **Project Settings -> API**.
4. Save the following keys — you will need them later:
   *   `Project URL` (Used as `SUPABASE_URL` and `VITE_SUPABASE_URL`)
   *   `anon` `public` API Key (Used as `VITE_SUPABASE_ANON_KEY`)
   *   `service_role` API Key (Used as `SUPABASE_SERVICE_ROLE_KEY` — must be kept secret)
5. Navigate to the **SQL Editor**, and run the SQL schema file located at `server/supabase_schema.sql` to create all tables and functions.

---

## Part 2: Backend Deployment (Render)
We recommend Render for hosting the Node.js backend.

1. Create an account on [Render](https://render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository containing the Abhimat code.
4. Configure the Web Service:
   *   **Name**: `abhimat-server`
   *   **Root Directory**: `server`
   *   **Environment**: `Node`
   *   **Build Command**: `npm install`
   *   **Start Command**: `npm start`
5. **Environment Variables**:
   Under the *Advanced* section, add the following Environment Variables:
   *   `PORT`: `10000` (Render's default)
   *   `SUPABASE_URL`: (Your Supabase Project URL)
   *   `SUPABASE_SERVICE_ROLE_KEY`: (Your Supabase `service_role` key - KEEP THIS SECRET)
   *   `JWT_SECRET`: (Generate a secure random string, at least 32 characters long)
   *   `CLIENT_URL`: (Leave this blank for now; we will update it after deploying the frontend)
6. Click **Create Web Service** and wait for the deployment to finish.
7. Copy the backend **Render URL** (e.g., `https://abhimat-server.onrender.com`).

---

## Part 3: Frontend Deployment (Netlify)
We recommend Netlify as it perfectly supports React+Vite PWA applications.

1. Go to [Netlify](https://www.netlify.com) and log in.
2. Click **Add new site** -> **Import an existing project**.
3. Connect to your GitHub repository.
4. Configure the Build settings:
   *   **Base directory**: `client`
   *   **Build command**: `npm run build`
   *   **Publish directory**: `client/dist` (Netlify might auto-detect this as `dist`)
5. **Environment Variables**:
   Click **Add environment variables** and add:
   *   `VITE_SUPABASE_URL`: (Your Supabase Project URL)
   *   `VITE_SUPABASE_ANON_KEY`: (Your Supabase `anon` `public` key)
   *   `VITE_API_URL`: (The Render URL of your backend, e.g., `https://abhimat-server.onrender.com`)
6. Click **Deploy site**.
7. Once deployed, Netlify will provide a public URL for your frontend (e.g., `https://abhimat-frontend.netlify.app`).

### Important: Netlify Redirects (For React Router)
Because React Router handles routing on the client side, you need to tell Netlify to redirect all traffic to `index.html`.
*   Create a file named `_redirects` inside the `client/public/` folder.
*   Add this exact line to the file:
    ```
    /*    /index.html   200
    ```

---

## Part 4: Finalizing Configuration (CORS)

Now that you have your Frontend URL from Netlify:
1. Go back to your **Render** dashboard.
2. Open your `abhimat-server` Web Service.
3. Go to **Environment**.
4. Update the `CLIENT_URL` to your exact Netlify Domain (e.g., `https://abhimat-frontend.netlify.app`). **Make sure there is NO trailing slash at the end of the URL.**
5. Save changes. Render will automatically redeploy the backend with the new CORS settings.

---

## Part 5: Testing Your Deployment
1. Open your Netlify Frontend URL.
2. Ensure you can log in / sign up (or perform actions).
3. If you encounter CORS errors in the browser console, double-check that `CLIENT_URL` in the backend exactly matches the frontend origin (including `https://` and without trailing slashes).
4. Verify that data from `/session/active` or WebSocket/polling correctly loads over HTTPS.

---

## Additional Notes
*   **Database Backups**: Regularly backup your Supabase data through their dashboard.
*   **Cold Starts**: If using Render's Free tier, the backend will "sleep" after 15 minutes of inactivity. The first request after it sleeps may take 30-50 seconds. To prevent this, consider upgrading to a paid Render tier or use a cron job (via cron-job.org) to ping the `/health` endpoint (`https://abhimat-server.onrender.com/health`) every 10 minutes.
