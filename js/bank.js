/* Bank zadań formy A – budowany deterministycznie; jego skrót (bankHash)
 * identyfikuje wersję testu. Zmiana generatora => inny skrót => wyniki nieporównywalne. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./rng.js'), require('./matrices.js'), require('./series.js'));
  else root.IQ = Object.assign(root.IQ || {}, factory(root.IQ, root.IQ, root.IQ));
})(this, function (R, M, S) {
  'use strict';
  const FORM_ID = 'A';
  const TIME_LIMITS = { matrices: 30 * 60, series: 15 * 60 }; // sekundy

  function buildBank() {
    const matrices = M.buildMatrices(FORM_ID);
    const series = S.buildSeries();
    const strip = it => { const c = Object.assign({}, it); delete c.rule; delete c.rules; delete c.attempt; return c; };
    const content = JSON.stringify({
      FORM_ID, TIME_LIMITS,
      m: matrices.items.map(strip), s: series.items.map(strip),
    });
    return { formId: FORM_ID, timeLimits: TIME_LIMITS, matrices, series, hash: R.hashHex(content) };
  }
  return { buildBank, FORM_ID, TIME_LIMITS };
});
