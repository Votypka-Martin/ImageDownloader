// Vercel Serverless Function: /api/image
// Proxy pro stahování obrázků z cdn.cosmos.so s obejitím CORS

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const urlObj = new URL(req.url, 'http://localhost');
  const imageUrl = urlObj.searchParams.get('url');
  const fileName = urlObj.searchParams.get('filename') || 'cosmos_image.jpg';
  const asAttachment = urlObj.searchParams.get('download') === '1';

  if (!imageUrl || !imageUrl.startsWith('http')) {
    res.status(400).json({ error: 'Neplatná nebo chybějící URL adresa obrázku' });
    return;
  }

  try {
    const upstreamRes = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36',
        'Referer': 'https://www.cosmos.so/',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
      }
    });

    if (!upstreamRes.ok) {
      res.status(upstreamRes.status).json({ error: `Obrázek nelze načíst (status ${upstreamRes.status})` });
      return;
    }

    const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, immutable');

    if (asAttachment) {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    }

    const arrayBuffer = await upstreamRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.status(200).send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Chyba při stahování obrázku', message: error.message });
  }
}
