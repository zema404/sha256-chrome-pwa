// Endpoint de TEST — observer QUI récupère l'aperçu d'un lien (WhatsApp, etc.).
//
// Contrairement à visitor-log.js (qui dépend du JavaScript côté navigateur et
// n'est donc JAMAIS déclenché par un robot d'aperçu), cet endpoint journalise
// l'IP et le User-Agent CÔTÉ SERVEUR, dès la requête du HTML. Il capture donc
// aussi les robots d'aperçu, qui n'exécutent pas de JavaScript.
//
// Deux points de capture :
//   - la PAGE  (récupération du HTML pour lire les balises og:)
//   - l'IMAGE  (récupération de og:image ?img=1)
//
// Le User-Agent permet de distinguer un robot d'aperçu (ex. "WhatsApp/2.x")
// d'un vrai clic depuis un navigateur.
//
// Logs : Vercel → ton projet → Logs, préfixe "[preview-test]".

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  return req.headers['x-real-ip'] || (req.socket && req.socket.remoteAddress) || 'inconnue';
}

// PNG 1x1 (pixel transparent) renvoyé pour la requête d'image.
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgYGAAAAAEAAH2FzhVAAAAAElFTkSuQmCC',
  'base64'
);

module.exports = function handler(req, res) {
  const ip = getClientIp(req);
  const ua = req.headers['user-agent'] || '';
  const isImage = req.query && (req.query.img === '1' || req.query.img === 'true');

  console.log('[preview-test]', JSON.stringify({
    ts: new Date().toISOString(),
    type: isImage ? 'image' : 'page',
    ip,
    ua,
    referer: req.headers['referer'] || ''
  }));

  if (isImage) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(PIXEL);
    return;
  }

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['host'] || '';
  const imgUrl = proto + '://' + host + '/api/preview-test?img=1';

  const html = '<!doctype html>\n' +
    '<html lang="fr"><head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta property="og:title" content="Test d\'aperçu de lien">\n' +
    '<meta property="og:description" content="Page de test pour observer la génération d\'aperçu.">\n' +
    '<meta property="og:image" content="' + imgUrl + '">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<title>Test d\'aperçu de lien</title>\n' +
    '</head><body>\n' +
    '<p>Page de test. Ta requête vient d\'être enregistrée (voir les logs Vercel, préfixe [preview-test]).</p>\n' +
    '</body></html>\n';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
};
