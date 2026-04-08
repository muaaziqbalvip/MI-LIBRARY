// api/download.js — Vercel Serverless Function
// Masks actual PDF source URLs for security

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  try {
    // Decode the masked token
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [pdfUrl, timestamp, uid] = decoded.split('|');

    // Validate token is not expired (30 minutes)
    const tokenAge = Date.now() - parseInt(timestamp || '0');
    if (tokenAge > 30 * 60 * 1000) {
      return res.status(410).json({ error: 'Download link expired. Please try again.' });
    }

    // Validate URL format
    if (!pdfUrl || !pdfUrl.startsWith('http')) {
      return res.status(400).json({ error: 'Invalid resource.' });
    }

    // Fetch the PDF from the actual source
    const response = await fetch(pdfUrl, {
      headers: {
        'User-Agent': 'LuminaLib-Proxy/1.0',
      }
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Could not fetch resource.' });
    }

    const contentType = response.headers.get('content-type') || 'application/pdf';
    const contentLength = response.headers.get('content-length');

    // Set proxy headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'attachment; filename="book.pdf"');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('X-Proxied-By', 'LuminaLib');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    // Stream the file
    const buffer = await response.arrayBuffer();
    return res.send(Buffer.from(buffer));

  } catch (err) {
    console.error('[Download API Error]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
