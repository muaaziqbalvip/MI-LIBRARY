// LuminaLib Download API — Masked URL handler
// Vercel serverless function

export default async function handler(req, res) {
  const { token, fallback } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  try {
    // Decode the token
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    const { id, uid, ts, hash } = decoded;

    // Validate token age (48 hours)
    if (Date.now() - ts > 48 * 60 * 60 * 1000) {
      return res.status(410).json({ error: 'Download link expired. Please re-download from the app.' });
    }

    // Reconstruct the URL from the hash
    const pdfUrl = Buffer.from(hash.split('').reverse().join(''), 'base64').toString('utf8');

    // Stream the PDF with proper headers
    const response = await fetch(pdfUrl);

    if (!response.ok) {
      // Fallback to direct URL if provided
      if (fallback) {
        return res.redirect(302, decodeURIComponent(fallback));
      }
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Set download headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="book-${id}.pdf"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Prevent hotlinking info exposure
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');

    const buffer = await response.arrayBuffer();
    return res.send(Buffer.from(buffer));

  } catch (err) {
    console.error('[Download API] Error:', err);
    // Fallback to direct URL
    if (fallback) {
      return res.redirect(302, decodeURIComponent(fallback));
    }
    return res.status(500).json({ error: 'Download failed' });
  }
}
