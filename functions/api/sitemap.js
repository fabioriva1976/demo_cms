const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { region } = require("../index");

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.sitemap = onRequest(
  { region },
  async (req, res) => {
    try {
      const pagesSnapshot = await admin.firestore()
        .collection('pages')
        .where('published', '==', true)
        .get();

      const baseUrl = req.headers.host.includes('localhost') 
        ? `http://${req.headers.host}` 
        : `https://${req.headers.host}`;

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      pagesSnapshot.forEach(doc => {
        const data = doc.data();
        const lastmod = data.updatedAt || data.createdAt;
        const date = lastmod ? new Date(lastmod.toDate()).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/${data.slug}</loc>\n`;
        xml += `    <lastmod>${date}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
      });

      xml += '</urlset>';

      res.set('Content-Type', 'application/xml');
      res.status(200).send(xml);
    } catch (error) {
      console.error('Errore generazione sitemap:', error);
      res.status(500).send('Errore generazione sitemap');
    }
  }
);
