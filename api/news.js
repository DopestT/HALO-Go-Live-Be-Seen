const { fetchNews } = require('../server/news');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  try {
    const items = await fetchNews();
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).json(items);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'news_unavailable' });
  }
};
