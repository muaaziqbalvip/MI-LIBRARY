// api/sitemap.js — Vercel Serverless Function
// Generates dynamic sitemap.xml with every book page for Google indexing

import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBbnU8DkthpYQMHOLLyj6M0cc05qXfjMcw",
  authDomain: "ramadan-2385b.firebaseapp.com",
  databaseURL: "https://ramadan-2385b-default-rtdb.firebaseio.com",
  projectId: "ramadan-2385b",
  storageBucket: "ramadan-2385b.firebasestorage.app",
  messagingSenderId: "882828936310",
  appId: "1:882828936310:web:7f97b921031fe130fe4b57"
};

const BASE = "https://mi-library.vercel.app";

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

  try {
    // Fetch all books from Firebase
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const snap = await get(ref(db, 'books'));
    const books = snap.val() || {};

    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
      { url: BASE + '/', priority: '1.0', changefreq: 'daily' },
      { url: BASE + '/?tab=trending', priority: '0.9', changefreq: 'hourly' },
      { url: BASE + '/?tab=search', priority: '0.7', changefreq: 'weekly' },
    ];

    const bookPages = Object.entries(books).map(([id, book]) => ({
      url: `${BASE}/?book=${id}`,
      priority: book.trending ? '0.95' : '0.85',
      changefreq: 'weekly',
      lastmod: today,
      title: book.title,
      image: book.coverUrl,
    }));

    const allPages = [...staticPages, ...bookPages];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allPages.map(p => `  <url>
    <loc>${escXml(p.url)}</loc>
    <lastmod>${p.lastmod || today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
    ${p.image ? `<image:image>\n      <image:loc>${escXml(p.image)}</image:loc>\n      ${p.title ? `<image:title>${escXml(p.title)}</image:title>` : ''}\n    </image:image>` : ''}
  </url>`).join('\n')}
</urlset>`;

    return res.status(200).send(xml);
  } catch (err) {
    console.error('[Sitemap Error]', err);
    // Fallback static sitemap
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE}/</loc><priority>1.0</priority></url>
</urlset>`);
  }
}

function escXml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
