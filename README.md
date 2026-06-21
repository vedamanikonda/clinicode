# CliniCode — Deployment Guide

## How to get a working link in ~20 minutes (no coding required)

---

### What you'll need
- A free **GitHub** account → github.com
- A free **Vercel** account → vercel.com  
- Your **Anthropic API key** → console.anthropic.com/keys

---

## Step 1 — Put the code on GitHub

1. Go to **github.com** and sign in (or create a free account)
2. Click the **"+"** icon (top right) → **"New repository"**
3. Name it `clinicode`, leave everything else as default, click **"Create repository"**
4. On the next page, click **"uploading an existing file"**
5. Unzip the `clinicode-nextjs.zip` file on your computer
6. Drag **all the files and folders** from inside it into the GitHub upload window
7. Click **"Commit changes"**

---

## Step 2 — Deploy to Vercel

1. Go to **vercel.com** and click **"Sign Up"** → choose **"Continue with GitHub"**
2. Once signed in, click **"Add New Project"**
3. Find **"clinicode"** in the list and click **"Import"**
4. Before clicking Deploy, click **"Environment Variables"** and add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** your API key (starts with `sk-ant-...`)
   - Click **"Add"**
5. Click **"Deploy"**

Wait about 60 seconds. Vercel will give you a URL like:

```
https://clinicode-abc123.vercel.app
```

**That's your competition link.** Share it — it's live and works for anyone.

---

## What happens when someone visits the link

- They see the CliniCode UI with a pre-loaded TKA operative note
- The AI analyzes the note automatically and flags documentation gaps
- They can edit the note or clear it and type their own
- The AI re-analyzes after they stop typing
- Clicking "Insert qualifier" replaces vague phrases with billing-ready language
- The Anthropic API key stays hidden on the server — visitors never see it

---

## Updating the app later

Any time you push new files to GitHub, Vercel automatically redeploys. Your link stays the same.

---

## Troubleshooting

**"Error: ANTHROPIC_API_KEY not configured"** — Go to Vercel → your project → Settings → Environment Variables → add the key, then redeploy.

**The app loads but analysis doesn't work** — Check your API key is correct and has available credits at console.anthropic.com.

**"Build failed"** — Make sure you uploaded all the files (including the `pages/` and `styles/` folders, not just the top-level files).
