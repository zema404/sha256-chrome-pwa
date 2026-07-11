// Journalisation des visites : signale la visite à la fonction serverless, qui
// enregistre l'adresse IP réelle côté serveur.
//
// Si le SITE reste hébergé sur GitHub Pages (et non sur Vercel), remplace
// LOG_ENDPOINT ci-dessous par l'URL Vercel complète de la fonction, par ex. :
//   var LOG_ENDPOINT = 'https://ton-projet.vercel.app/api/log-ip';
(function () {
  var LOG_ENDPOINT = '/api/log-ip';
  try {
    fetch(LOG_ENDPOINT + '?page=' + encodeURIComponent(location.pathname), {
      method: 'POST',
      cache: 'no-store',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: location.pathname })
    }).catch(function () {
      /* réseau indisponible : on ignore silencieusement */
    });
  } catch (e) {
    /* fetch indisponible : on ignore */
  }
})();
