# Getting Started & Setup Guide

This guide explains how to run StudyGold and its documentation site on your machine.

---

## Prerequisites

- **Node.js:** version 18.17 or higher
- **Python:** version 3.10 or higher (for viewing documentation via MkDocs)
- **Google Gemini API Key:** Free from [Google AI Studio](https://aistudio.google.com/)

---

## 1. Running the Next.js Application

### Step 1: Install Dependencies
Open your terminal in the project folder and run:
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Open `.env.local` and add your Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note on Database:** You do **not** have to fill in Supabase keys. If left blank, StudyGold automatically uses `.local-store.json` to save all your data locally.

### Step 3: Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 4: Running Tests
To run the automated test suite:
```bash
npm test
```

---

## 2. Running This MkDocs Documentation Site

You can run this interactive documentation site locally with live reloading:

### Step 1: Install MkDocs (if not already installed)
```bash
pip install mkdocs mkdocs-material
```

### Step 2: Preview the Documentation
Run this command from the root project folder:
```bash
mkdocs serve
```
Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser. Any edits you make to files in `docs/` or `mkdocs.yml` will automatically refresh in your browser.

### Step 3: Build Static HTML (Optional)
If you want to generate static HTML files to host on GitHub Pages:
```bash
mkdocs build
```
The compiled HTML website will be created in the `site/` folder.
