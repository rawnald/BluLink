# DataLink — Geospatial & Link Analysis Intelligence Workspace

A high-performance Link Analysis and Geospatial Intelligence workspace built with **Tailwind CSS**, **DM Sans** typography, a strict 3-color design palette (**Blue, White, Black**), and serverless persistence on **Cloudflare D1 SQL Database** with **Cloudflare Pages**.

---

## ⚡ Architecture Overview

- **Frontend**: Single-page application using Leaflet (Google Hybrid, Satellite, Terrain layers) and Vis.js Network.
- **Backend**: Cloudflare Pages Functions (`/api/auth/*` and `/api/workspace/*`).
- **Database**: Cloudflare D1 (Serverless SQLite edge database with zero cold-starts).
- **Security**: Web Crypto API salted SHA-256 password hashing with 30-day token sessions.

---

## 🚀 Step 1: Push to GitHub

1. Initialize git and commit files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: DataLink with Cloudflare D1 & Pages"
   ```

2. Create a new repository on [GitHub](https://github.com/new) (e.g. `datalink`).

3. Link and push to GitHub:
   ```bash
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/datalink.git
   git branch -M main
   git push -u origin main
   ```

---

## ☁️ Step 2: Create Cloudflare D1 Database

You can do this either via the Cloudflare Dashboard or Wrangler CLI.

### Option A: Using Wrangler CLI (Fastest)

1. Log in to Cloudflare:
   ```bash
   npx wrangler login
   ```

2. Create the D1 database:
   ```bash
   npx wrangler d1 create datalink-db
   ```
   *Take note of the `database_id` output.*

3. Update `wrangler.toml` with your `database_id`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "datalink-db"
   database_id = "YOUR_CLOUDFLARE_D1_DATABASE_ID"
   ```

4. Execute the SQL schema on your remote Cloudflare D1 database:
   ```bash
   npx wrangler d1 execute datalink-db --remote --file=./schema.sql
   ```

### Option B: Using Cloudflare Web Dashboard

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com/) and go to **Storage & Databases** → **D1 SQL Database**.
2. Click **Create Database**, name it `datalink-db`.
3. Click on the database → **Console** tab.
4. Copy the SQL from `schema.sql`, paste it into the console, and click **Execute**.

---

## 🌐 Step 3: Deploy to Cloudflare Pages from GitHub

1. In Cloudflare Dashboard, navigate to **Compute (Workers) & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Select your GitHub repository (`datalink`).
3. Set Build Settings:
   - **Framework preset**: `None`
   - **Build command**: *(leave blank)*
   - **Build output directory**: `.` (root directory)
4. Click **Save and Deploy**.
5. Once deployed, link the D1 database:
   - Go to your Pages project → **Settings** → **Functions** → **D1 Database Bindings**.
   - Click **Add binding**:
     - Variable name: `DB`
     - D1 database: Select `datalink-db`
   - Click **Save**.
6. Trigger a redeploy (or push a commit) so the binding takes effect.

Your DataLink application is now live globally on your Cloudflare Pages URL!

---

## 💻 Local Development

To run locally with a local SQLite D1 simulation:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run local migrations:
   ```bash
   npm run d1:migrate:local
   ```

3. Start local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:8788` in your browser.

