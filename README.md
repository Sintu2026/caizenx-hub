# Caizenx Hub - Investment Comparison Model

A web application comparing S&P 500 returns vs Real Estate Construction investments (Condo & Townhouse), with Canadian tax calculations.

## Features

- **S&P 500 Analysis**: Annual returns with dividend yield and tax calculations
- **Condo Construction**: 4-year cycle with 2x multiplier (configurable)
- **Townhouse Construction**: 3-year cycle with 2x multiplier (configurable)
- **Canadian Tax Integration**: 26% capital gains tax applied per cycle
- **Save/Load Scenarios**: Store your scenarios in the cloud
- **Interactive Charts**: Visual comparison using Recharts

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Hosting**: Vercel

---

## Deployment Instructions

### Step 1: Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Run this SQL to create the scenarios table:

```sql
-- Create scenarios table
CREATE TABLE scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  data JSONB NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_scenarios_user_email ON scenarios(user_email);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (simple version)
CREATE POLICY "Allow all operations" ON scenarios
  FOR ALL USING (true) WITH CHECK (true);
```

4. Click **Run** to execute

### Step 2: Push to GitHub

1. Create a new repository on GitHub called `caizenx-hub`
2. In your terminal, navigate to this project folder and run:

```bash
git init
git add .
git commit -m "Initial commit - Investment Comparison App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/caizenx-hub.git
git push -u origin main
```

Or use **GitHub Desktop**:
1. Open GitHub Desktop
2. File → Add Local Repository → Select this folder
3. Publish repository

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project**
3. Select your `caizenx-hub` repository
4. In the **Environment Variables** section, add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://donvwpckngfoedjqjokw.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbnZ3cGNrbmdmb2VkanFqb2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3Mjk2OTksImV4cCI6MjA4NDMwNTY5OX0.tLxK8NUcW-zarLHXQy-d_Tv9pkrQttq8KbyeJBPfgn4` |

5. Click **Deploy**
6. Wait 1-2 minutes for deployment to complete

### Step 4: Your App is Live! 🎉

Vercel will give you a URL like: `https://caizenx-hub.vercel.app`

---

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
caizenx-hub/
├── app/
│   ├── globals.css      # Tailwind CSS styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main Investment Comparison app
├── lib/
│   └── supabase.ts      # Supabase client configuration
├── .env.local           # Environment variables (not in git)
├── package.json         # Dependencies
├── tailwind.config.js   # Tailwind configuration
└── README.md            # This file
```

---

## Customization

### Change Tax Rates
Edit the default values in `app/page.tsx`:
- `condoTaxRate` - default 26%
- `townhouseTaxRate` - default 26%
- `sp500CapGainsTax` - default 26%

### Add New Investment Types
Copy the condo/townhouse calculation pattern in `page.tsx` and add new state variables and UI sections.

---

## Support

Built for Caizenx Homes Ltd. by Claude AI.
