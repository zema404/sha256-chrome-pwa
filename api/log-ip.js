// Fonction serverless Vercel — journalise l'adresse IP des visiteurs.
//
// L'adresse IP réelle est lue depuis les en-têtes ajoutés par l'infrastructure
// Vercel (elle ne peut donc pas être falsifiée côté client, contrairement à une
// IP envoyée dans le corps de la requête).
//
// Les entrées apparaissent dans les logs Vercel :
//   Vercel → ton projet → Logs (Observability).
//
// NOTE PERSISTANCE : console.log écrit dans les logs d'exécution Vercel, qui
// sont temporaires (rétention limitée). Pour un stockage durable, branche
// Vercel KV / Postgres / un webhook à l'endroit indiqué plus bas.

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) {
    // x-forwarded-for peut contenir une liste ; le premier élément est
    // l'adresse cliente d'origine.
    return xff.split(',')[0].trim();
  }
  if (req.headers['x-real-ip']) return req.headers['x-real-ip'];
  return (req.socket && req.socket.remoteAddress) || 'inconnue';
}

module.exports = function handler(req, res) {
  // CORS : autorise l'appel depuis la page, y compris si elle reste hébergée
  // sur GitHub Pages (origine différente de la fonction).
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const ip = getClientIp(req);
  const page =
    (req.query && req.query.page) ||
    (req.body && typeof req.body === 'object' && req.body.page) ||
    '';

  const entry = {
    ts: new Date().toISOString(),
    ip,
    page: String(page).slice(0, 200),
    ua: (req.headers['user-agent'] || '').slice(0, 300),
    referer: (req.headers['referer'] || '').slice(0, 300)
  };

  // --- Journalisation ---
  // Visible dans les logs Vercel. Pour un stockage durable, ajoute ici l'écriture
  // vers Vercel KV / une base de données / un webhook, par exemple :
  //   await kv.lpush('visitors', JSON.stringify(entry));
  console.log('[visitor]', JSON.stringify(entry));

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ip });
};
