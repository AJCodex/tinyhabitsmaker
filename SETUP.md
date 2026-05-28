# TinyHabitsMaker — Setup Guide

A simple habit tracker for the whole family — each person signs in with Google, tracks their own habits, and an admin can see everyone's progress. Hosted free on GitHub Pages with Firebase Firestore.

## What you need (all free)

- A Google account (for Firebase + sign-in)
- A GitHub account (for hosting + repo)
- Node.js 18+ on your PC

---

## Step 1 — Create the Firebase project (5 min)

1. Go to https://console.firebase.google.com → **Add project** → name it `tinyhabitsmaker` (analytics off is fine).
2. **Build → Firestore Database → Create database** → **production mode** → pick a region near you.
3. **Build → Authentication → Get started → Sign-in method → Google → Enable** → set a project support email → **Save**.
4. **Project settings (⚙️) → General → Your apps → Web app (`</>`)** → register an app named `tinyhabitsmaker-web` → copy the `firebaseConfig` values.
5. In this folder, copy `.env.example` to `.env.local` and paste the six values.
6. **Firestore Database → Rules** — paste this and **Publish**:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {

       // Helper: is the signed-in user an admin?
       function isAdmin() {
         return request.auth != null
           && exists(/databases/$(database)/documents/users/$(request.auth.uid))
           && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
       }

       // Users can read/update their OWN profile. Admins can read all.
       // No one can flip isAdmin from the client.
       match /users/{uid} {
         allow read: if request.auth != null && (request.auth.uid == uid || isAdmin());
         allow create: if request.auth != null
                       && request.auth.uid == uid
                       && request.resource.data.isAdmin == false;
         allow update: if request.auth != null
                       && request.auth.uid == uid
                       && request.resource.data.isAdmin == resource.data.isAdmin;
         allow delete: if isAdmin();
       }

       // Habits — owner-only writes, owner + admin reads
       match /habits/{id} {
         allow read: if request.auth != null
                     && (resource.data.userId == request.auth.uid || isAdmin());
         allow create: if request.auth != null
                       && request.resource.data.userId == request.auth.uid;
         allow update, delete: if request.auth != null
                       && resource.data.userId == request.auth.uid;
       }

       // Completions — same rule shape as habits
       match /completions/{id} {
         allow read: if request.auth != null
                     && (resource.data.userId == request.auth.uid || isAdmin());
         allow create: if request.auth != null
                       && request.resource.data.userId == request.auth.uid;
         allow update, delete: if request.auth != null
                       && resource.data.userId == request.auth.uid;
       }
     }
   }
   ```

---

## Step 2 — Run it locally

```bash
npm install
npm run dev
```

Open the URL printed (usually http://localhost:5173). Sign in with your Google account.

### Make yourself admin (one-time)

1. After your first sign-in, go to **Firebase Console → Firestore Database → Data**.
2. Open the `users` collection → click your user document.
3. Edit the `isAdmin` field → change `false` to `true` → **Update**.
4. Refresh the app — you should see the new **👥 Everyone** tab.

Anyone else who signs in is a regular user by default.

---

## Step 3 — Deploy to GitHub Pages

1. Create a new GitHub repo (e.g. `tinyhabitsmaker`), then from this folder:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/tinyhabitsmaker.git
   git push -u origin main
   ```

2. **GitHub repo → Settings → Pages → Source: GitHub Actions**.

3. **GitHub repo → Settings → Secrets and variables → Actions → New repository secret** — add each:

   - `VITE_FB_API_KEY`
   - `VITE_FB_AUTH_DOMAIN`
   - `VITE_FB_PROJECT_ID`
   - `VITE_FB_STORAGE_BUCKET`
   - `VITE_FB_MSG_SENDER_ID`
   - `VITE_FB_APP_ID`

4. Push (or **Actions → Deploy → Run workflow**). Site goes live at:

   ```
   https://<your-username>.github.io/tinyhabitsmaker/
   ```

5. **Firebase Console → Authentication → Settings → Authorized domains** — add `<your-username>.github.io`.

Share the URL — anyone with a Google account can sign in and start tracking their own habits.

---

## Data model

- `users/{uid}` — `{ displayName, email, photoURL, isAdmin, createdAt, lastSeenAt }`
- `habits/{habitId}` — `{ userId, name, emoji, points, createdAt }` (max 5 per user, enforced client-side)
- `completions/{habitId}_{YYYY-MM-DD}` — `{ userId, habitId, date, completedAt }`

Free tier limits (Spark plan): 1 GB storage, 50K reads/day, 20K writes/day — plenty for a family.

## Troubleshooting

- **Blank page on GitHub Pages**: check Actions tab for build errors. Usually a missing secret.
- **`Missing or insufficient permissions`**: Firestore rules not updated, or Google sign-in not enabled.
- **Sign-in popup is blocked**: allow popups for the site.
- **Admin tab missing**: check `isAdmin: true` is set on your user doc in Firestore, then refresh.
- **Sign-in fails on deployed URL**: add `<you>.github.io` to Firebase Authentication → Authorized domains.
