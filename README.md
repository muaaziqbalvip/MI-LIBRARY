# 📚 LuminaLib – Digital Books Library

A production-ready, full-stack 3D Digital Books Library built with Firebase + Vercel.

---

## 🗂 Project Structure

```
luminalib/
├── index.html          # Main user-facing library UI
├── admin.html          # Admin Control Center (passcode: 123456)
├── sw.js               # Service Worker (PWA + offline reading)
├── manifest.json       # PWA manifest
├── vercel.json         # Vercel deployment config
├── robots.txt          # SEO robots file
├── sitemap.xml         # SEO sitemap (update URLs after deploy)
├── api/
│   └── download.js     # Serverless proxy for PDF link masking
└── README.md
```

---

## 🚀 Deploy to Vercel

1. **Create a GitHub repo** and push all these files.
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo.
3. **No build step needed** — it's pure HTML/JS.
4. Click **Deploy** and you're live!

---

## 🔧 Firebase Setup

Your Firebase config is already embedded. Make sure these rules are set in Firebase Console:

### Realtime Database Rules:
```json
{
  "rules": {
    "books": {
      ".read": true,
      ".write": "auth != null"
    },
    "analytics": {
      ".read": "auth != null",
      ".write": true
    },
    "comments": {
      ".read": true,
      ".write": "auth != null"
    },
    "ratings": {
      ".read": true,
      ".write": "auth != null"
    },
    "live_viewers": {
      ".read": true,
      ".write": true
    }
  }
}
```

### Enable Authentication:
- Go to Firebase Console → Authentication → Sign-in Methods
- Enable **Google** provider

---

## 🛡 Admin Access

- URL: `yoursite.vercel.app/admin.html`
- Default passcode: **123456** ← Change this immediately!
- Go to Settings tab inside admin to update passcode.

---

## ✨ Features

| Feature | Status |
|---------|--------|
| 3D Book Gallery | ✅ |
| Google Sign-In | ✅ |
| PDF Reader (Google Docs viewer) | ✅ |
| Offline Reading (Service Worker) | ✅ |
| Live Viewers Counter | ✅ |
| Ratings & Comments | ✅ |
| Smart "Suggested For You" | ✅ |
| Real-time Visitor Analytics | ✅ |
| Link Masking (API Proxy) | ✅ |
| Multi-language Translation | ✅ |
| Bottom Navigation (Mobile-app style) | ✅ |
| PWA (Install as App) | ✅ |
| SEO Optimized | ✅ |
| Admin CRUD Panel | ✅ |
| Passcode Lock | ✅ |

---

## 📱 PWA Installation

Users can install LuminaLib as a native app:
- **Android**: Chrome → Menu → "Add to Home Screen"
- **iOS**: Safari → Share → "Add to Home Screen"
- **Desktop**: Chrome → Address bar → Install icon

---

## 🔍 Google Search Console

1. After deploying, go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add your Vercel URL as a property
3. Submit `/sitemap.xml`
4. Update sitemap URLs to match your actual domain

---

## 📖 Adding Books (Admin Panel)

1. Open `yoursite.vercel.app/admin.html`
2. Enter passcode (default: 123456)
3. Go to **Books** tab → **+ Add New Book**
4. Fill in: Title, Author, Category, Cover Image URL, PDF URL
5. Optionally mark as Trending 🔥
6. Save!

---

## 🎨 Tech Stack

- **Frontend**: HTML5, Tailwind CSS, Vanilla JS (ES6+), Animate.css
- **Backend**: Firebase Realtime Database + Auth
- **Hosting**: Vercel (free tier supported)
- **PWA**: Service Worker + Web App Manifest
- **Analytics**: Custom Firebase-powered visitor tracking

---

## ⚠️ Security Notes

- Change the admin passcode from 123456 before going live
- Firebase Database Rules restrict writes to authenticated users
- PDF links are masked via API proxy (Vercel serverless function)
- Admin panel is excluded from search engine indexing (robots.txt)

---

Built with ❤️ by LuminaLib
