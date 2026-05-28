# TinyHabitsMaker ⭐

A tiny, real-time habit tracker for two people to share — built for a daughter + parent setup. Free to run forever on **GitHub Pages + Firebase Firestore**.

## Features

- ✅ Daily checklist of habits (tap to mark done)
- 🔥 Streak counter per habit
- 📊 Last-7-day and last-30-day completion charts
- ⭐ Star points pile up with each completion
- 🔄 Real-time sync between any number of devices

## Stack

React + Vite + Tailwind CSS · Firebase (Firestore + Anonymous Auth) · Recharts · GitHub Pages

## Getting started

See **[SETUP.md](./SETUP.md)** for the full walkthrough (Firebase project + GitHub Pages deploy). TL;DR:

```bash
cp .env.example .env.local   # fill in Firebase values
npm install
npm run dev
```

Then push to GitHub and the included Actions workflow deploys to Pages automatically.
